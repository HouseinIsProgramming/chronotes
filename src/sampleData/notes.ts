export const sampleNotes = {
  markdownBasics: {
    title: "Markdown Basics Guide",
    content: `# Markdown Basics Guide

## What is Markdown?

Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents.

## Basic Syntax

### Headers
Use # for different levels:
# H1
## H2
### H3

### Emphasis
*Italic text* or _italic text_
**Bold text** or __bold text__
***Bold and italic***

### Lists
Unordered lists use asterisks, plus, or hyphens:
- First item
- Second item
  - Sub-item
  - Another sub-item

Ordered lists use numbers:
1. First item
2. Second item
3. Third item

### Links and Images
[Link text](URL)
![Image alt text](image URL)

### Code
Inline code uses \`backticks\`

Code blocks use triple backticks:
\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

### Blockquotes
> This is a blockquote
> It can span multiple lines

## Tips
- Keep it simple
- Use preview mode to check formatting
- Practice regularly`,
    tags: ["markdown", "documentation", "writing"],
  },
  reactComponents: {
    title: "React Components Explained",
    content: `# Understanding React Components

## What are Components?

Components are the building blocks of React applications. They are reusable pieces of UI that can contain their own content, logic, and styling.

## Types of Components

### 1. Function Components
\`\`\`jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
\`\`\`

### 2. Class Components
\`\`\`jsx
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
\`\`\`

## Best Practices
- Keep components focused and small
- Use meaningful names
- Follow the single responsibility principle
- Extract reusable logic into custom hooks

## Props vs State
- Props are read-only and passed from parent
- State is internal and managed by the component
- Use state for values that change over time`,
    tags: ["react", "components", "frontend"],
  },
  reactHooks: {
    title: "Essential React Hooks",
    content: `# React Hooks Guide

## What are Hooks?

Hooks are functions that let you "hook into" React state and lifecycle features from function components.

## Common Hooks

### useState
\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`
Used for managing local state in a component.

### useEffect
\`\`\`jsx
useEffect(() => {
  // Side effect code here
  return () => {
    // Cleanup code here
  };
}, [dependencies]);
\`\`\`
Used for handling side effects in your components.

### useContext
\`\`\`jsx
const value = useContext(MyContext);
\`\`\`
Used for consuming context in your components.

## Rules of Hooks
1. Only call hooks at the top level
2. Only call hooks from React functions
3. Use the eslint-plugin-react-hooks`,
    tags: ["react", "hooks", "frontend"],
  },
  asyncAwait: {
    title: "JavaScript Async/Await Guide",
    content: `# Understanding Async/Await in JavaScript

## What is Async/Await?

Async/await is a way to handle asynchronous operations in a more readable and maintainable way.

## Basic Syntax

\`\`\`javascript
async function getData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
\`\`\`

## Key Concepts

1. \`async\` functions always return a Promise
2. \`await\` can only be used inside \`async\` functions
3. Error handling using try/catch

## Common Use Cases

- API calls
- File operations
- Database queries
- Any Promise-based operations

## Best Practices
- Always use try/catch with await
- Avoid callback hell
- Consider Promise.all for parallel operations
- Handle errors appropriately`,
    tags: ["javascript", "async", "programming"],
  },
  javascriptPromises: {
    title: "JavaScript Promises Deep Dive",
    content: `# Understanding JavaScript Promises

## What are Promises?

Promises are objects representing the eventual completion (or failure) of an asynchronous operation.

## Promise States
- Pending: Initial state
- Fulfilled: Operation completed successfully
- Rejected: Operation failed

## Creating Promises

\`\`\`javascript
const myPromise = new Promise((resolve, reject) => {
  // Asynchronous operation
  if (/* operation successful */) {
    resolve(result);
  } else {
    reject(error);
  }
});
\`\`\`

## Promise Methods
- .then() - Handle success
- .catch() - Handle errors
- .finally() - Execute regardless of outcome

## Common Patterns
\`\`\`javascript
Promise.all([promise1, promise2])
  .then(results => {
    // Handle all resolved promises
  })
  .catch(error => {
    // Handle any rejection
  });
\`\`\`

## Best Practices
- Always handle rejections
- Chain promises appropriately
- Use Promise.all for parallel operations
- Consider async/await for cleaner code`,
    tags: ["javascript", "promises", "programming"],
  },
  appTutorial: {
    title: "Welcome to Chronotes",
    content: `# Welcome to Chronotes! 👋

## Your New Note-Taking Experience

Chronotes is a modern note-taking application designed to help you organize your thoughts, knowledge, and ideas efficiently.

### 🚀 Key Features

- **Markdown Support**: Write beautifully formatted notes using simple Markdown syntax, also supports Latex for math formulas (view "Writing Guide" after generating sample data in the settings).
- **Smart Organization**: Use folders to group related notes together
- **Tags**: Add tags to your notes for easy categorization and searching
- **Review System**: Keep your knowledge fresh, by reviewing your notes regularly, click on the "Review" button on the top left to view when you last reviewed your notes.
- **Kanban Board**: Visualize your notes and tasks in a Kanban-ish view

##  📼 Demo :
### If you just want to quickly have a couple of random notes generated for you, you can click on the "Settings" at the bottom left, then click on generate sample data.

### 📝 Getting Started

1. **Creating Notes**: Click the "+" button in the sidebar to create a new note
2. **Organizing**: Use folders to keep your notes organized
3. **Finding Notes**: Use the search bar at the top to quickly find any note
4. **Review Mode**: Switch to review mode to practice and reinforce your knowledge
5. **AI-FEATURES!!!**: Click on Generate FLashcards to get AI-Generated Flashcards of the note youre reviewing.
6. **Flashcards**: You can view your flashcards by clicking on the "Flashcards" button on the top left.

### Note: 

  - This is just an MVP for now, expect some bugs and missing features. this is still in development.

### 🎨 Pro Tips

- Use \`Ctrl/Cmd + S\` to save your notes quickly
- Press \`Ctrl/Cmd + K\` to search for your notes, you can also use tags.
- Click on tags to add and change them.
- Switch between light and dark themes in settings
- Use the Kanban board for task management

We've included some sample notes to help you get started. Feel free to explore them to learn more about Markdown, React, and JavaScript!

### 🤝 Need Help?

Contact me at [housein.aboshaar@gmail.com](mailto:housein.aboshaar@gmail.com) if you have any questions or need assistance with your note-taking experience.

Happy note-taking! 📚`,
    tags: ["welcome", "tutorial", "getting-started"],
    created_at: new Date().toISOString(),
    last_reviewed_at: new Date().toISOString(),
    folder_id: "welcome",
  },
};

export const sampleFolders = [
  {
    name: "Welcome",
    notes: ["welcome"],
  },
  {
    name: "React Essentials",
    notes: ["reactComponents", "reactHooks"],
  },
  {
    name: "JavaScript Fundamentals",
    notes: ["asyncAwait", "javascriptPromises"],
  },
  {
    name: "Writing Guide",
    notes: ["markdownBasics"],
  },
];
