---
title: compilation error when using Comparator.comparing()
date: 2019-12-10 18:13:12
tags: [java]
---

## the problem
First, lets take a look at the following code sample:

```java
Collections.sort(playlist, Comparator.comparing(s -> s.getTitle())
              .thenComparing(p1 -> p1.getDuration())
              .thenComparing(p1 -> p1.getArtist())
);
```

What we are trying to do is simple: sort the `playlist` order by three different properties.
Can this code snippet pass the compilation check?
The answer is: No, there would be some compilation error.

```java
Error:(43, 59) java: cannot find symbol
  symbol:   method getTitle()
  location: variable s of type java.lang.Object
```

But why?

The reason for this compilation error is that the type inference for Java language is weak in this case.
It is expected that JVM knows what the type of the elements in `playlist` is when it is reading the first lambda `s->s.getTitle()`.
But actually, JVM is not able to figure it out.


## the solutions
There are three approaches to solve this problem.

### use static lambda expression

```java
Collections.sort(playlist, Comparator.comparing(Song::getTitle)
              .thenComparing(Song::getDuration)
              .thenComparing(Song::getArtist)
);
```

### use explicitly defined lambda with a temorary variable

```java
Comparator<Song> byName = (song1, song2) -> song1.getArtist().compareTo(song2.getArtist());
Comparator<Song> byDuration = (song1, song2) -> Integer.compare(song1.getDuration(), song2.getDuration());
Collections.sort(playlist, byName.thenComparing(byDuration));
```


### add explicity type parameter before the Comparator.comparing() is called

```java
Collections.sort(playlist, Comparator.<Song, String>comparing((s) -> s.getTitle())
              .thenComparing(p1 -> p1.getDuration())
              .thenComparing(p1 -> p1.getArtist())
);
```


## reference

[Very confused by Java 8 Comparator type inference](http://stackoverflow.com/questions/24436871/very-confused-by-java-8-comparator-type-inference)
