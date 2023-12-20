const wordlist: string[] = [
  // Colors
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "brown",
  "gray",
  "silver",
  "gold",

  // Animals
  "cat",
  "dog",
  "elephant",
  "tiger",
  "lion",
  "giraffe",
  "zebra",
  "monkey",
  "kangaroo",
  "koala",
  "panda",
  "penguin",
  "dolphin",
  "shark",
  "octopus",
  "parrot",
  "butterfly",
  "squirrel",
  "snake",
  "rabbit",

  // Fruits
  "apple",
  "banana",
  "cherry",
  "strawberry",
  "kiwi",
  "orange",
  "grape",
  "lemon",
  "watermelon",
  "pineapple",
  "mango",
  "pear",
  "peach",
  "plum",
  "blueberry",
  "raspberry",
  "blackberry",
  "cranberry",
  "pomegranate",
  "coconut",
];


  export function generateRandomWord(numberOfWords: number): string {
    
    // create a copy of the wordlist to avoid words being used twice
    const wordlistCopy = [...wordlist];

    let res = "";
    for (let i = 0; i < numberOfWords; i++) {
        const index = Math.floor(Math.random() * wordlistCopy.length);
        res += wordlistCopy[index];
        if (i < numberOfWords - 1) {
            res += "-";
        }
    }

    return res;
  }