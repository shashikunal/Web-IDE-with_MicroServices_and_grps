# Java with External Libraries - Complete Demo

## 🎯 What I Created For You

I've created a complete Java project that demonstrates how to use external libraries (Gson, Guava, Apache Commons Lang) in your IDE.

### 📁 Files Created:

```
examples/java-with-libraries/
├── pom.xml                              # Maven configuration
├── src/main/java/com/example/Main.java # Demo application
└── README.md                            # This file
```

## 🚀 How to Use This in Your IDE

### Step 1: Open Your IDE
Go to http://localhost:5174

### Step 2: Create a New Java Workspace
Click on "Java" template

### Step 3: Copy the Files

**File 1: `pom.xml`** (in root directory)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>demo-app</artifactId>
    <version>1.0.0</version>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>3.14.0</version>
        </dependency>
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>33.0.0-jre</version>
        </dependency>
    </dependencies>
</project>
```

**File 2: `Main.java`** (create in your editor)
```java
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.common.collect.ImmutableList;
import org.apache.commons.lang3.StringUtils;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== Java with External Libraries Demo ===\n");
        
        // Demo 1: Gson - JSON Processing
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        Person person = new Person("Alice", 30, "alice@example.com");
        String json = gson.toJson(person);
        System.out.println("Person as JSON:");
        System.out.println(json);
        
        // Demo 2: Guava - Immutable Collections
        ImmutableList<String> fruits = ImmutableList.of(
            "Apple", "Banana", "Cherry"
        );
        System.out.println("\nFruits:");
        fruits.forEach(f -> System.out.println("  - " + f));
        
        // Demo 3: Apache Commons Lang - String Utilities
        String text = "hello world";
        System.out.println("\nString Utilities:");
        System.out.println("Original: " + text);
        System.out.println("Capitalized: " + StringUtils.capitalize(text));
        System.out.println("Reversed: " + StringUtils.reverse(text));
        
        System.out.println("\n=== Demo Complete! ===");
    }
}

class Person {
    private String name;
    private int age;
    private String email;
    
    public Person(String name, int age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }
}
```

### Step 4: Run in Terminal

In your IDE terminal, run:
```bash
# Download dependencies
mvn dependency:resolve

# Compile and run
mvn compile exec:java -Dexec.mainClass="Main"
```

OR simply click **"Run Code"** button!

## 📊 Expected Output

```
=== Java with External Libraries Demo ===

Person as JSON:
{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com"
}

Fruits:
  - Apple
  - Banana
  - Cherry

String Utilities:
Original: hello world
Capitalized: Hello world
Reversed: dlrow olleh

=== Demo Complete! ===
```

## 💡 What This Demonstrates

### 1. **Gson** - JSON Processing
```java
Gson gson = new Gson();
String json = gson.toJson(person);  // Object to JSON
Person p = gson.fromJson(json, Person.class);  // JSON to Object
```

### 2. **Guava** - Better Collections
```java
ImmutableList<String> list = ImmutableList.of("A", "B", "C");
// Thread-safe, cannot be modified
```

### 3. **Apache Commons Lang** - String Utilities
```java
StringUtils.capitalize("hello");  // "Hello"
StringUtils.reverse("hello");     // "olleh"
StringUtils.isBlank("   ");       // true
```

## 🔧 How It Works

1. **pom.xml** tells Maven which libraries to download
2. Maven downloads JARs from Maven Central
3. JARs are added to classpath automatically
4. Your code can import and use the libraries
5. Everything runs in Docker container (no CORS issues!)

## 📦 Adding More Libraries

Want to use more libraries? Just add to `pom.xml`:

```xml
<dependency>
    <groupId>GROUP_ID</groupId>
    <artifactId>ARTIFACT_ID</artifactId>
    <version>VERSION</version>
</dependency>
```

Find libraries at: https://mvnrepository.com/

### Popular Libraries:

**Spring Boot** (Web framework)
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.2.0</version>
</dependency>
```

**Jackson** (Alternative JSON library)
```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.16.1</version>
</dependency>
```

**JUnit** (Testing)
```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.1</version>
    <scope>test</scope>
</dependency>
```

## ✅ Summary

This example shows you:
- ✅ How to set up Maven dependencies
- ✅ How to use external libraries (Gson, Guava, Commons Lang)
- ✅ How to run Java with libraries in your IDE
- ✅ No CORS issues (runs in container!)
- ✅ Full Maven Central access

**The key**: Everything runs in Docker, so you have full access to all Java libraries without any browser limitations! 🚀

## 🎓 Next Steps

1. Try the example in your IDE
2. Modify the code
3. Add more libraries from Maven Central
4. Build your own Java applications!

Happy coding! 🎉
