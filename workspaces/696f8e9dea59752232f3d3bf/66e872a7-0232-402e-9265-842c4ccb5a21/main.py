# Python 3.11 - Core Interpretera
# Write your Python code here

def greet(name):
    return f"Hello, {name}!"

def main():
    print("Welcome to Python!")
    print(greet("World"))
    
    # Example: Basic calculations
    numbers = [1, 2, 3, 4, 5]
    total = sum(numbers)
    print(f"Sum of {numbers} = {total}")
    
    # Example: List comprehension
    squares = [x**2 for x in numbers]
    print(f"Squares: {squares}")

if __name__ == "__main__":
    main()
