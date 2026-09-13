const fs = require('fs');

const paragraphText = "Hello world this is a test paragraph.";
const selectedText = "this is";
const lastIndex = 0;
const startOffset = 12; // "Hello world " is 12 chars
const endOffset = 19; // "this is" is 7 chars

console.log("Extracted:", paragraphText.substring(startOffset, endOffset).trim());
console.log("Selected:", selectedText.trim());
console.log("Match:", paragraphText.substring(startOffset, endOffset).trim() === selectedText.trim());

