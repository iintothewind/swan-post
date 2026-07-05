---
title: add timeout support for CompletableFuture in java 8
date: 2019-08-13 14:42:50
tags: java
---

## reason

`CompletableFuture` is a useful tool introduced since java 8.
It provides many convenient methods for concurrency handling.
Yet it did not support timeout in java 8 version.

Two new methods were added to `CompletableFuture` since java 9 to support timeout:

```java
public CompletableFuture<T> orTimeout(long timeout, TimeUnit unit)
public CompletableFuture<T> completeOnTimeout(T value, long timeout, TimeUnit unit)
```


### CompletableFuture.orTimeout() in java 9

A `CompletableFuture` would be completed exceptionally with `TimeoutException` if it did not complete with a `result` within given timeout.
The timeout feature was implemented by using two static final classes `Delayer` and `Timeout`.

```java
public CompletableFuture<T> orTimeout(long timeout, TimeUnit unit) {
  if (unit == null)
      throw new NullPointerException();
  if (result == null)
      whenComplete(new Canceller(Delayer.delay(new Timeout(this), timeout, unit)));
  return this;
}
```

If `result` is not given, The `CompletableFuture.completeExceptionally()` for current instance will be called in a scheduled task created by `Delayer.delay()` after the given timeout.

## solution in java 8

First we need to create a `CompletableFuture` named `promise` which always fails with `TimeoutException` after given timeout.
We can reuse the code implementation of `Delayer` and `Timeout` in java 9 to fail the created `promise`.

The always-fail `CompletableFuture` can be implemented as:
```java
final CompletableFuture<T> promise = new CompletableFuture<>();
Delayer.delay(new Timeout(promise), duration.toMillis(), TimeUnit.MILLISECONDS);
```

Then we can use `CompletableFuture.applyToEither()` to combine the results:
```java
static <T> CompletableFuture<T> within(CompletableFuture<T> completableFuture, Duration duration) {
  Objects.requireNonNull(completableFuture, "completableFuture is required");
  Objects.requireNonNull(duration, "duration is required");
  final CompletableFuture<T> promise = new CompletableFuture<>();
  Delayer.delay(new Timeout(promise), duration.toMillis(), TimeUnit.MILLISECONDS);
  return completableFuture.applyToEither(promise, Function.identity());
}
```

For `within()` method, it takes a `completableFuture` and returns a `CompletableFuture` instance when the input `completableFuture` is completed. However if it takes too long to completed the input `completableFuture`, `promise` will be returned as output after the given `duration`,
`TimeoutException` will be thrown in its completed result.

## sample code

```java
@Test
public void testTimeoutSupportFuture() {
  CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    try {
      TimeUnit.MILLISECONDS.sleep(100);
    } catch (InterruptedException e) {
      Throwables.throwIfUnchecked(e);
    }
    return "this is a message";
  });

  final CompletableFuture<String> future1 = TimeoutSupportFuture.within(future, Duration.ofMillis(50));
  final CompletableFuture<String> future2 = TimeoutSupportFuture.within(future, Duration.ofMillis(200));
  future1.whenComplete((s, throwable) -> {
    if (s != null) {
      log.info("s == {}", s);
    } else {
      log.info(throwable.getMessage());
    }
  });
  future2.whenComplete((s, throwable) -> {
    if (s != null) {
      log.info("s == {}", s);
    } else {
      log.info(throwable.getMessage());
    }
  });
}
```

output:
```
2019-08-13 16:20:20.998 [CompletableFutureDelayScheduler] INFO  sample.concurrent.CompletableFutureSample - java.util.concurrent.TimeoutException
2019-08-13 16:20:21.039 [ForkJoinPool.commonPool-worker-3] INFO  sample.concurrent.CompletableFutureSample - s == this is a message
```



## implementation for `TimeoutSupportFuture`


```java
import java.time.Duration;
import java.util.Objects;
import java.util.concurrent.*;
import java.util.function.Function;

public interface TimeoutSupportFuture {

  static <T> CompletableFuture<T> within(CompletableFuture<T> completableFuture, Duration duration) {
    Objects.requireNonNull(completableFuture, "completableFuture is required");
    Objects.requireNonNull(duration, "duration is required");
    final CompletableFuture<T> promiseFailed = new CompletableFuture<>();
    Delayer.delay(new Timeout(promiseFailed), duration.toMillis(), TimeUnit.MILLISECONDS);
    return completableFuture.applyToEither(promiseFailed, Function.identity());
  }

  /**
   * Action to completeExceptionally on timeout
   * copy from `java.util.concurrent.CompletableFuture.Timeout` in java 9 JDK
   */
  final class Timeout implements Runnable {
    final CompletableFuture<?> future;

    Timeout(CompletableFuture<?> f) {
      this.future = f;
    }

    @Override
    public void run() {
      if (future != null && !future.isDone()) {
        future.completeExceptionally(new TimeoutException());
      }
    }
  }

  /**
   * Singleton delay scheduler, used only for starting and cancelling tasks.
   * copy from `java.util.concurrent.CompletableFuture.Delayer` in java 9 JDK
   */
  final class Delayer {
    static final ScheduledThreadPoolExecutor delayer;

    static {
      (delayer = new ScheduledThreadPoolExecutor(1, new DaemonThreadFactory())).setRemoveOnCancelPolicy(true);
    }

    static final class DaemonThreadFactory implements ThreadFactory {
      @Override
      public Thread newThread(Runnable runnable) {
        Thread t = new Thread(runnable);
        t.setDaemon(true);
        t.setName("CompletableFutureDelayScheduler");
        return t;
      }
    }

    static ScheduledFuture<?> delay(Runnable command, long delay, TimeUnit unit) {
      return delayer.schedule(command, delay, unit);
    }
  }
}
```

## summary

A `CompletableFuture` instance can have timeout support with the help of `CompletableFuture.applyToEither()`.
But there is a significant difference between **timeout** and **cancel**.
**timeout** means, A `CompletableFuture` instance will complete with `TimeoutException` if it does not complete its task within given time.
**cancel** means, A `CompletableFuture` instance will cancel the task during its execution, and complete with `CancellationException` if it does not complete its task within given time.

While `CompletableFuture` has a serius **design flaw** in its `cancel()` method:

```java
/**
 * @param mayInterruptIfRunning – this value has no effect in this implementation because interrupts are not used to control processing
 */
public boolean cancel(boolean mayInterruptIfRunning)
```
This `cancel()` method only returns a flag and assign `CancellationException` to result, thats all.

**It never really cancels any executing tasks!**

So you are on your own to make sure that any task executed in `CompletableFuture` should be quit properly.
If you have applied a task into `CompletableFuture` and its execution never ends, this task would be executed forever till JVM exists!
Unless this is what you want, don't use `CompletableFuture` in this way.

## reference

[Asynchronous Timeouts with CompletableFuture](https://dzone.com/articles/asynchronous-timeouts)
