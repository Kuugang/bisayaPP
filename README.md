# BISAYA++

Bisaya++ is a strongly–typed high–level interpreted Cebuano-based programming language developed to teach Cebuanos
the basics of programming. Its simple syntax and native keywords make programming easy to learn.

## Installation

```sh
git clone https://github.com/Kuugang/bisayaPP && cd bisayaPP
npm install
```

## Usage

```sh
node bisaya.js inputfile
```

Where `inputfile` is a BISAYA++ source file.

## Syntax Overview

### Program Structure

Program Structure:

- all codes are placed inside SUGOD and KATAPUSAN
- all variable declaration is starts with MUGNA
- all variable names are case sensitive and starts with letter or an underscore (\_) and followed by a letter, underscore or digits.
- every line contains a single statement
- comments starts with double minus sign(--) and it can be placed anywhere in the program
- all reserved words are in capital letters and cannot be used as variable names
- dollar sign($) signifies next line or carriage return
- ampersand(&) serves as a concatenator
- the square braces([]) are as escape code

A BISAYA++ program starts with `SUGOD` and ends with `KATAPUSAN`:

```bisaya
SUGOD
    // Your code here
KATAPUSAN
```

### Variable Declaration

Use `MUGNA` to declare variables with a data type:

```bisaya
MUGNA NUMERO x = 10
MUGNA PULONG message = "Hello!"
```

### Input and Output

- **Printing Output:** Use `IPAKITA` to display values:

  ```bisaya
  IPAKITA: "Hello, World!"
  ```

- **User Input:** Use `DAWAT` to get user input:

  ```bisaya
  DAWAT: user_input
  ```

### Control Structures

#### Conditional Statements

```bisaya
KUNG x > 5 THEN
    IPAKITA: "Greater than 5"
KUNG WALA
    IPAKITA: "Less than or equal to 5"
```

#### Loops

- **For Loop (`ALANG SA`)**

  ```bisaya
  ALANG SA i = 0, i < 5, i + 1 PUNDOK {
      IPAKITA: i
  }
  ```

- **While Loop (`SAMTANG`)**

  ```bisaya
  SAMTANG (x < 10) PUNDOK {
      IPAKITA: x
      x = x + 1
  }
  ```

- **Do-While Loop (`BUHAT` ... `SAMTANG`)**

  ```bisaya
  BUHAT PUNDOK {
      IPAKITA: x
      x = x + 1
  } SAMTANG (x < 10)
  ```

### Functions

Define a function using `LIHOK`:

```bisaya
LIHOK sum(NUMERO a, NUMERO b) NUMERO PUNDOK {
    IULI a + b
}
```

Call the function:

```bisaya
IPAKITA: sum(3, 5)
```

## Tokens and Keywords

### Data Types

- `NUMERO` (Integer)
- `TIPIK` (Float)
- `LETRA` (Character)
- `PULONG` (String)
- `TINUOD` (Boolean)

### Operators

- Arithmetic: `+`, `-`, `*`, `/`, `%`, `^`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `UG` (AND), `O` (OR), `DILI` (NOT)

### Special Keywords

- `SUGOD`, `KATAPUSAN` - Start and end of the program
- `MUGNA` - Variable declaration
- `IULI` - Return statement
- `PADAYON` - Continue statement
- `HUNONG` - Break statement
- `PUNDOK` - Code block `{}`
- `DAWAT` - Input
- `IPAKITA` - Print
- `ALANG SA` - For loop
- `SAMTANG` - While loop
- `BUHAT` - Do-while loop
- `LIHOK` - Function declaration

## Sample Programs

```
SUGOD
    MUGNA NUMERO x, y, z=5
    MUGNA LETRA a_1=’n’
    MUGNA TINUOD t=”OO”
    x=y=4
    a_1=’c’
    -- this is a comment
    IPAKITA: x & t & z & $ & a_1 & [#] & “last”
KATAPUSAN
```

Output:

```
4OO5
c#last
```

```
SUGOD
    MUGNA NUMERO xyz, abc=100
    xyz= ((abc *5)/10 + 10) * -1
    IPAKITA: [[] & xyz & []]
KATAPUSAN
```

Output:

```
[-60]
```

```
SUGOD
    ALANG SA (ctr=1, ctr<=10, ctr++)
    PUNDOK{
    IPAKITA: ctr & ‘ ‘
    }
KATAPUSAN
```

Output:

```
1 2 3 4 5 6 7 8 9 10
```
