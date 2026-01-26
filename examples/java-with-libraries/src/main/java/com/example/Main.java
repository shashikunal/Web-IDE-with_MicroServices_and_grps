package com.example;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.common.collect.ImmutableList;
import org.apache.commons.lang3.StringUtils;

import java.util.List;

/**
 * Demo application showing how to use external libraries
 * This example uses:
 * - Gson for JSON serialization
 * - Guava for immutable collections
 * - Apache Commons Lang for string utilities
 */
public class Main {
    
    public static void main(String[] args) {
        System.out.println("=== Java with External Libraries Demo ===\n");
        
        // Demo 1: Using Gson for JSON
        demoGson();
        
        // Demo 2: Using Guava Collections
        demoGuava();
        
        // Demo 3: Using Apache Commons Lang
        demoCommonsLang();
        
        // Demo 4: Combining all libraries
        demoCombined();
    }
    
    /**
     * Demo 1: Gson - JSON serialization and deserialization
     */
    private static void demoGson() {
        System.out.println("--- Demo 1: Gson (JSON Processing) ---");
        
        // Create a Gson instance
        Gson gson = new GsonBuilder()
            .setPrettyPrinting()
            .create();
        
        // Create a Person object
        Person person = new Person("Alice", 30, "alice@example.com");
        
        // Convert to JSON
        String json = gson.toJson(person);
        System.out.println("Person as JSON:");
        System.out.println(json);
        
        // Convert back from JSON
        Person personFromJson = gson.fromJson(json, Person.class);
        System.out.println("\nDeserialized Person:");
        System.out.println(personFromJson);
        System.out.println();
    }
    
    /**
     * Demo 2: Guava - Immutable collections
     */
    private static void demoGuava() {
        System.out.println("--- Demo 2: Guava (Immutable Collections) ---");
        
        // Create an immutable list
        ImmutableList<String> fruits = ImmutableList.of(
            "Apple", "Banana", "Cherry", "Date", "Elderberry"
        );
        
        System.out.println("Immutable List of Fruits:");
        fruits.forEach(fruit -> System.out.println("  - " + fruit));
        
        // Try to demonstrate immutability
        System.out.println("\nList is immutable - cannot be modified!");
        System.out.println("Size: " + fruits.size());
        System.out.println();
    }
    
    /**
     * Demo 3: Apache Commons Lang - String utilities
     */
    private static void demoCommonsLang() {
        System.out.println("--- Demo 3: Apache Commons Lang (String Utilities) ---");
        
        String text = "hello world";
        
        // Capitalize
        String capitalized = StringUtils.capitalize(text);
        System.out.println("Original: " + text);
        System.out.println("Capitalized: " + capitalized);
        
        // Reverse
        String reversed = StringUtils.reverse(text);
        System.out.println("Reversed: " + reversed);
        
        // Check if blank
        String empty = "   ";
        System.out.println("\nIs '   ' blank? " + StringUtils.isBlank(empty));
        System.out.println("Is 'hello' blank? " + StringUtils.isBlank(text));
        
        // Abbreviate
        String longText = "This is a very long text that needs to be abbreviated";
        String abbreviated = StringUtils.abbreviate(longText, 30);
        System.out.println("\nOriginal: " + longText);
        System.out.println("Abbreviated: " + abbreviated);
        System.out.println();
    }
    
    /**
     * Demo 4: Combining all libraries
     */
    private static void demoCombined() {
        System.out.println("--- Demo 4: Combining All Libraries ---");
        
        // Create a list of people using Guava
        ImmutableList<Person> people = ImmutableList.of(
            new Person("Alice", 30, "alice@example.com"),
            new Person("Bob", 25, "bob@example.com"),
            new Person("Charlie", 35, "charlie@example.com")
        );
        
        // Use Gson to convert to JSON
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String json = gson.toJson(people);
        
        System.out.println("Team Members (JSON):");
        System.out.println(json);
        
        // Use Commons Lang to process names
        System.out.println("\nProcessed Names:");
        people.forEach(person -> {
            String upperName = StringUtils.upperCase(person.getName());
            String reversed = StringUtils.reverse(person.getName());
            System.out.println("  " + person.getName() + " -> " + upperName + " (reversed: " + reversed + ")");
        });
        
        System.out.println("\n=== Demo Complete! ===");
    }
}

/**
 * Simple Person class for demonstration
 */
class Person {
    private String name;
    private int age;
    private String email;
    
    public Person(String name, int age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }
    
    public String getName() {
        return name;
    }
    
    public int getAge() {
        return age;
    }
    
    public String getEmail() {
        return email;
    }
    
    @Override
    public String toString() {
        return "Person{name='" + name + "', age=" + age + ", email='" + email + "'}";
    }
}
