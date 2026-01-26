# Java with External Libraries - Demo

This example demonstrates how to use external libraries (Maven dependencies) in your Java projects.

## 📦 Libraries Used

1. **Gson** (2.10.1) - JSON serialization/deserialization
2. **Apache Commons Lang** (3.14.0) - String utilities
3. **Google Guava** (33.0.0) - Immutable collections

## 🚀 How to Run

### Method 1: In the Web IDE

1. **Open the IDE** at http://localhost:5174
2. **Create a Java workspace**
3. **Copy these files:**
   - `pom.xml` (Maven configuration)
   - `src/main/java/com/example/Main.java` (Main code)
4. **Click "Run Code"**
5. Maven will automatically download dependencies and run!

### Method 2: Command Line

```bash
# Navigate to the project directory
cd examples/java-with-libraries

# Clean and compile
mvn clean compile

# Run the application
mvn exec:java -Dexec.mainClass="com.example.Main"
```

### Method 3: Manual Compilation

```bash
# Download dependencies
mvn dependency:copy-dependencies

# Compile
javac -cp "target/dependency/*" src/main/java/com/example/Main.java -d target/classes

# Run
java -cp "target/classes:target/dependency/*" com.example.Main
```

## 📝 What This Demo Shows

### Demo 1: Gson (JSON Processing)
- Creating objects
- Converting to JSON
- Parsing JSON back to objects
- Pretty printing

### Demo 2: Guava (Collections)
- Creating immutable lists
- Safe, thread-safe collections
- Functional programming style

### Demo 3: Apache Commons Lang (String Utilities)
- Capitalizing strings
- Reversing strings
- Checking blank strings
- Abbreviating long text

### Demo 4: Combined Usage
- Using all libraries together
- Real-world example
- Processing collections with utilities

## 🎯 Expected Output

```
=== Java with External Libraries Demo ===

--- Demo 1: Gson (JSON Processing) ---
Person as JSON:
{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com"
}

Deserialized Person:
Person{name='Alice', age=30, email='alice@example.com'}

--- Demo 2: Guava (Immutable Collections) ---
Immutable List of Fruits:
  - Apple
  - Banana
  - Cherry
  - Date
  - Elderberry

List is immutable - cannot be modified!
Size: 5

--- Demo 3: Apache Commons Lang (String Utilities) ---
Original: hello world
Capitalized: Hello world
Reversed: dlrow olleh

Is '   ' blank? true
Is 'hello' blank? false

Original: This is a very long text that needs to be abbreviated
Abbreviated: This is a very long text...

--- Demo 4: Combining All Libraries ---
Team Members (JSON):
[
  {
    "name": "Alice",
    "age": 30,
    "email": "alice@example.com"
  },
  {
    "name": "Bob",
    "age": 25,
    "email": "bob@example.com"
  },
  {
    "name": "Charlie",
    "age": 35,
    "email": "charlie@example.com"
  }
]

Processed Names:
  Alice -> ALICE (reversed: ecilA)
  Bob -> BOB (reversed: boB)
  Charlie -> CHARLIE (reversed: eilrahC)

=== Demo Complete! ===
```

## 💡 Key Concepts

### Maven Dependencies
The `pom.xml` file declares all external libraries:
```xml
<dependencies>
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.10.1</version>
    </dependency>
    <!-- ... more dependencies ... -->
</dependencies>
```

### Automatic Download
When you run the code:
1. Maven reads `pom.xml`
2. Downloads JARs from Maven Central
3. Adds them to classpath
4. Compiles and runs your code

### No CORS Issues!
Because this runs in a Docker container (not browser):
- ✅ Full access to Maven Central
- ✅ All dependencies work
- ✅ No security restrictions

## 🔧 Customization

### Add More Dependencies

Edit `pom.xml` and add:
```xml
<dependency>
    <groupId>GROUP_ID</groupId>
    <artifactId>ARTIFACT_ID</artifactId>
    <version>VERSION</version>
</dependency>
```

Find dependencies at: https://mvnrepository.com/

### Popular Libraries to Try

```xml
<!-- Spring Boot -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
    <version>3.2.0</version>
</dependency>

<!-- Jackson (JSON) -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.16.1</version>
</dependency>

<!-- Lombok (Reduce boilerplate) -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.30</version>
</dependency>
```

## 📚 Learn More

- [Maven Central Repository](https://mvnrepository.com/)
- [Gson Documentation](https://github.com/google/gson)
- [Guava Documentation](https://github.com/google/guava)
- [Commons Lang Documentation](https://commons.apache.org/proper/commons-lang/)

## ✅ Summary

This example shows:
- ✅ How to use Maven dependencies
- ✅ How to work with external libraries
- ✅ How to combine multiple libraries
- ✅ Real-world Java development patterns

Perfect for learning how to build Java applications with external libraries in your IDE! 🚀
