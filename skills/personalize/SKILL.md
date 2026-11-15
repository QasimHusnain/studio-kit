---
name: personalize
description: Write a version of each campaign email for every lead group in leads/leads.csv. Use when a campaign's emails are final and you want one copy per group.
argument-hint: "[campaign folder]"
context: fork
allowed-tools: Read, Glob, Grep, Write
---

# Personalize a campaign for each lead group

Campaign folder: $ARGUMENTS

You are making one copy of each finished campaign email for every lead group, so each group reads an opening and an example that fit their life. The originals are final and approved. That is why almost everything is copied exactly and only a few named parts change: anything else you touch is a part nobody has checked against the brand.

This skill works for any client. Everything about the business (its name, sender, links, phone number, sign-off, footer, reviews, groups and brand rules) comes from the client's own files in the current project. Never bring in details from another client or from this skill's examples.

This runs in a forked context. The main chat only sees your final reply, so do all the reading, writing and checking here and return a short summary.

## Step 1: Check the input

1. **No campaign folder given** (the line above is empty): Glob `campaigns/*/` and stop. Reply with the list of campaign folders that exist and ask which one to use. Write nothing.
2. **Folder doesn't exist**: stop, say so, and list the campaign folders that do exist. Write nothing.
3. **No emails**: Glob `<campaign folder>/emails/*.md`. If there is no `emails/` folder, or it holds no `.md` files, stop and say which one it is ("no emails/ folder" or "emails/ folder is empty"). Write nothing.

Accept the folder as `campaigns/<name>`, `campaigns/<name>/` or just `<name>`; they all mean `campaigns/<name>`.

## Step 2: Read the client's files

Read these before writing anything:

1. `brand/voice.md`: the voice, words to avoid, claims never to make, any approved reviews (and any limits on where a review may be used), the email layout and the sign-off. If it is missing, stop and say so. Write nothing.
2. `.claude/rules/emails.md`: the layout every email file must follow, including the one main link, anything allowed beside it, the sign-off and the footer. If it is missing, stop and say so. Write nothing.
3. `leads/leads.csv`: take the distinct values of the `group` column. Use only that column. Never copy a name or email address into an email, since these copies are templates filled in later by placeholders such as `{{first_name}}`.
   - If the file has no `group` column, or no group values, stop and say so. Write nothing.
4. `leads/CLAUDE.md`, if it exists: look for a "Groups" section (any heading containing "Groups"). It describes who each group is. These descriptions are how you fit each copy to its group.
5. Every file in `<campaign folder>/emails/*.md`. Read only the top-level `emails/` folder. Never use an existing `groups/` copy as a source, because it may be out of date.
6. Glob `<campaign folder>/groups/*/emails/*.md` and note which copies already exist, so you can count the files you replace.
7. `<campaign folder>/plan.md`, if it exists: look for a list of suggested reviews per group.

If the voice guide has an approved review list, check each original's review against it. If an original uses a review that isn't on the list word for word, or one the voice guide says not to use for this kind of email, don't write copies of that email. Report it in the summary, because the fix belongs in the original, not in the copies.

Check each review in the plan's per-group list the same way. If one fails, don't use it: keep the original's review for that group and report it in the summary.

## Step 3: Decide what changes and what doesn't

### Copied exactly, character for character

- The `Subject:` line.
- The `Preview:` line.
- The greeting and every `{{...}}` placeholder.
- The order of paragraphs and every paragraph you aren't changing.
- Any review line, with its quote marks, dash and name, unless the plan names a different review for this group (change 3 below).
- The main link line, exactly as `.claude/rules/emails.md` gives it, with anything the rule puts beside it (such as a phone number).
- The sign-off from `brand/voice.md`.
- The footer links and footer lines from `.claude/rules/emails.md`.

The easiest way to get this right is to start from the original text and edit it, not to retype the email.

### What you change

1. **The opening line**: the first paragraph after the greeting. Rewrite it so it speaks to the group, while keeping its job (for example, the sender introducing themselves and saying why they're writing).
2. **One example**: one sentence or short paragraph in the body that pictures the reader's situation. Pick the one that most clearly describes a particular kind of reader. If a paragraph already lists several kinds of reader, that is the one to change, narrowed to this group. Change one example only, even if others could be tuned too.
3. **The review, in the first email only**: in the first email of the campaign (the lowest-numbered file in `emails/`, such as `01-...md`), if the plan names a review for this group and it passed the Step 2 check, replace the original's review line with it, copied word for word from `brand/voice.md`. If the plan names none for this group, or the email has no review, keep the original as it is. In every later email, keep the original's review exactly.
4. **Lines meant for another group**: any sentence elsewhere in the body that opens by naming a different kind of reader, such as "If you're a …, …".
   - For a group it doesn't fit, delete just that sentence. Leave the rest of the paragraph as it is.
   - For the group it names, rewrite it to speak to them directly, without the "If you're a…" opening.
   - Don't use this to make other changes. Only a sentence that clearly addresses one kind of reader counts.

Keep each rewrite about the same length as what it replaces, in the same voice, and a natural fit with the sentences around it.

### How to fit each group

- **A group described in the "Groups" section of `leads/CLAUDE.md`**: fit the opening and example to that description.
- **A group with no description**: fit the opening and example to what the group name plainly means, using the same care, and mention the group in the summary so someone can review it. If the name gives no clear meaning, still write the copy with a light, general change and say so in the summary.

## Step 4: Brand rules for every change

Every change must still follow `brand/voice.md`:

- The voice it describes.
- None of the words or phrases on its avoid list.
- None of the claims it says never to make: no new prices, promises, numbers, ratings, accreditations or reviews.
- Any term it says must always be written a certain way (for example, in full), written that way.
- Any greeting or seasonal wording it rules out, avoided.

Take extra care with groups that may be more vulnerable or anxious: reassure, don't worry.

If a change breaks a rule, rewrite the change. Never bend the rule.

## Step 5: Check each copy before saving it

For every copy, compare it with the original line by line before you call Write:

1. **Subject**: identical.
2. **Preview**: identical.
3. **Main link line**: identical, and still the only main link in the body.
4. **Review**: in the first email, the plan's review for this group if it names one that passed, otherwise the original's. In every later email, identical to the original's. Any review is on the approved list word for word.
5. **Sign-off and footer**: identical, from the sign-off to the last line.
6. **Only the allowed changes**: apart from the opening line, the one example, the review and lines meant for another group (Step 3), every line matches the original. No sentence aimed at a different kind of reader is left in the copy.
7. **Brand check**: the changed parts pass every rule in Step 4.
8. **Fits the group**: the opening and example clearly speak to this group and not to another one.

If any check fails, fix the copy and check again. Save only a copy that passes all eight.

## Step 6: Save

Write each copy to `<campaign folder>/groups/<group>/emails/<same file name>`, using the group name exactly as it appears in the CSV. Overwrite a copy that is already there. Never change or save over the originals in `emails/`.

After saving everything, run one last check across the saved copies with Grep on `<campaign folder>/groups/`:

- The words and phrases on the voice guide's avoid list (should find nothing that isn't already in the original).
- Any term the voice guide says must be written in full, written without it (should find nothing).
- `Subject:` and the main link text once in every file.
- `If you're a` sentences aimed at a group other than the folder they're in (should find nothing).

Fix and re-save any file this turns up.

## Step 7: Reply

Reply with a short summary only. Don't paste whole emails.

- How many files you wrote (groups × emails), and how many of them replaced existing copies.
- One example opening line per group, and the reviewer's name used for each group (if the emails carry a review).
- Only if they apply: any group without a description in `leads/CLAUDE.md`, any email skipped and why, any plan review rejected and why.

For example:

```
Wrote 8 files (2 groups × 4 emails); 0 replaced existing copies.

- <group-one>: "<opening line written for group one>"
- <group-two>: "<opening line written for group two>"
```
