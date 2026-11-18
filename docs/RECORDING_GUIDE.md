# Part B recording guide (10 to 15 minutes, face on camera)

Keep your face visible the whole time (a small corner window is fine). Do one practice run first and check the UI in your own browser.

## 1. Run the tool and explain it (about 5 minutes)

1. **Open on the problem (30s).** "Reviewers get reading material and have to write questions. The risk is a question about something the material never taught. This tool generates the group and makes that risk visible."
2. **Show it start to finish (2 min).** Paste your assignment's reading material (or Load sample), click *Write five questions*. Point out the 2 + 2 + 1 mix. Click question 1: show the highlighted source line on the left.
3. **Review actions (1.5 min).** Edit a question, show the stamp go to "Edited, re-check needed". Click *Approve*. Reject one and use *Write a different one*. Approve all five and export.
4. **Tools and why (1 min).**
   - React + Vite: fast to start, what the brief asked for.
   - Node + Express: one language across the stack, tiny API.
   - Claude via plain `fetch`: no SDK to learn, easy to swap. Model is configurable (`MODEL`).
   - Demo mode: so the project runs for anyone without a key.
   - Say the main trade-off: strict word-for-word evidence check means some fine paraphrases get rejected, on purpose.

## 2. Show one input that produced questions (about 2 minutes)

Use your real reading material. Open question 3 or 5 and say: "This is the line it relied on, here it is in the text, and here are the checks." Then do the failure demo, which is what makes the tool convincing:
- Open a true/false question, replace the source line with a sentence you invent (for example about closures), click *Re-check*.
- It turns **Not supported by the material**, Approve refuses, and Export would be blocked.

## 3. Teach one concept (about 4 to 5 minutes)

Pick one concept from your material. Below is a ready script for **block scope** from the sample material; adapt it to your own material if it differs.

**Hook (20s):** "Have you ever created a variable and then your code said it doesn't exist? Today you'll learn why."

**Idea (60s):** "A *block* is anything between curly braces: an `if`, a loop, a function. Variables made with `let` and `const` live only inside the block where you created them. Think of the braces as a room: things you bring into the room stay in the room."

**Live code (90s):** type this and run it.

```js
if (true) {
  let message = "hello";
  console.log(message); // hello
}
console.log(message);   // ReferenceError
```

Say what each line does. Point at the error: "JavaScript isn't broken, `message` genuinely doesn't exist out here."

**Contrast (60s):** show the same thing with `var`, which leaks out of the block, and say why most people avoid it.

**Check for understanding (30s):** "What do you think prints if I use `var` instead of `let`?" Pause, then show it.

**Recap (20s):** "`let` and `const` are block scoped. Outside the braces they don't exist."

## Tips
- Say what you are about to click before clicking.
- If something fails on camera, say what you think happened and fix it; that reads as real.
- Mention one thing you would improve next (for example, using several evidence lines per question or saving reviews between sessions).
