---
title: the reason of NoClassDefFoundError and how to fix it
date: 2020-05-08 15:48:27
tags: [java]
---

## problem
Recently some team members reported that some instances of our application occasionally failed to serve an upload request because it constantly threw the same error:

```Java
st=java.lang.NoClassDefFoundError: Could not initialize class xxx.SomeUtil
at xxxImpl.upload(xxx.Java:xxx)
at sun.reflect.GeneratedMethodAccessor106.invoke(Unknown Source) at
..........
..........
```

## code with issues

While this `SomeUtil` has been implemented like as below:

```Java
public class SomeUtil {
  private static Map<String, String> entries = ImmutableMap.of();

  static {
    loadEntries();
  }

  private static void loadEntries() {
    try {
      entries = DbAccess.loadEntries();
    } catch (Exception e) {
      log.error("loadEntries error: {}", e.getMessage());
      throw new IllegalStateException(e);
    }
  }

  public static String getEntry(@NonNull String key) {
    // .....
    String result = entries.getOrDefault(key, "");
    // .....
    return result;
  }
}
```

The util class `SomeUtil` is trying to load entries from database in static block.
The entries will be loaded only once when the first time  class `SomeUtil` is invoked.
If anything goes wrong with the databse access, `IllegalStateException` will be thrown from the method `loadEntries()`.

## analysis

From the code above, it is obviously that the method `loadEntries()` is suspicious.
Since it could throw `IllegalStateException` when database access failed.

So I made a little change to the method and tried to reproduce the exception:

```Java
  private static void loadEntries() {
    try {
      //entries = DbAccess.loadEntries();
      throw new RuntimeException("db access error");
    } catch (Exception e) {
      log.error("loadEntries error: {}", e.getMessage());
      throw new IllegalStateException(e);
    }
  }
```

Then I wrote a unit test as:

```Java
@Test
public void testStaticBlock() {
  SomeUtil.getEntry("some-key");
}
```

After I ran the test, I found it did throw an error but not the same as `java.lang.NoClassDefFoundError` as reported:

```Java
java.lang.ExceptionInInitializerError
	at sample.SomeTest.testStaticBlock(EventButTest.java:46)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
Caused by: java.lang.IllegalStateException: java.lang.RuntimeException: db access error
```

Why the error is `ExceptionInInitializerError` but not `NoClassDefFoundError`?
I thought it over and over.
When I tried to think `loadEntries()` might not be the root cause and tried some where elese,
I suddely realised this `NoClassDefFoundError` may have been thrown many times again and again.
Why don't try to call `loadEntries()` multiple times?
Then I made below changes to the test code:

```Java
@Test
public void testStaticBlock() {
  try{
    SomeUtil.getEntry("some-key");
  } catch (Throwable t) {
    // do nothing
  }
  SomeUtil.getEntry("some-key");
}
```

And ran the test then finally I can reproduce the same error as reported:

```java
java.lang.NoClassDefFoundError: Could not initialize class test.SomeUtil
```

## root cause
So now we can confirm that method `loadEntries()` really is the root cause.
Since the first time when this method is called in static block, some how there was a database access error.
Due to this db error, the initialization of the `SomeUtil` class failed.
Since static block can only be run once.
Then after this failure, when more upload request calls come, more `NoClassDefFoundError` will be produced.

## solution
We can either remove the static block, and change the load logic to call `loadEntries()` when `getEntry()` is called in this method. We should check the size of `entries`. When size of `entries` is empty, call `loadEntries()` to update the state of `entries`.

Alternatively, we can keep the static block, but ensure no `Throwable` is thrown in this static block.
Let `getEntry()` handle the state when `entries` is empty.


## conclusion

- Getting `NoClassDefFoundError` does NOT mean that you class is missing (in that case you'd get a `ClassNotFoundException`). `NoClassDefFoundError` means class loader ran into an error while reading the class definition when trying to read the class.

- In this above case, you can reproduce the same error by invoke the issue method more than one time. (catch the first `ExceptionInInitializerError` to avoid code breaks at the first time).

- Avoid throwing exception or error in static block when you try to use it.
