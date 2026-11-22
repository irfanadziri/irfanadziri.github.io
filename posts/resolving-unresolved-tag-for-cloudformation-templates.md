# Resolving “Unresolved tag: <tag>” for CloudFormation Templates

> Configure VSCode to recognize custom YAML tags like !ImportValue, and understand common tags for a smoother CloudFormation template crafting.

- Type: Post
- Published: 2024-07-22
- Tags: cloudformation, tooling
- Source: https://irfanadziri.dev/posts/resolving-unresolved-tag-for-cloudformation-templates/

---

When working with AWS CloudFormation templates in VSCode, issues with unresolved tags such as `!ImportValue`, `!Ref`, etc. may encountered. These custom tags are essential for creating CloudFormation templates, and properly configuring VSCode to recognize them can significantly improve template crafting experience.

## Custom Tags in YAML

Custom tags in YAML allow architects, developers, and engineers to embed domain-specific data in YAML files. These tags are used to define specific intrinsic functions that AWS CloudFormation can interpret and execute, and are crucial for creating dynamic and flexible infrastructure as code.

## Guide to Add Custom Tags

To resolve the “Unresolved tag: !ImportValue” and other similar issues, custom tags need to be added to VSCode settings. Follow these steps:

1. **Open VSCode**, `cmd` + `shift` + `P` (or `ctrl` + `shift` + `P` on Windows) and choose “Preferences: Open User Settings (JSON)”.

2. **Add the following lines** to the `settings.json` file:

   ```json
   "yaml.customTags": [
     "!Equals sequence",
     "!FindInMap sequence",
     "!GetAtt",
     "!GetAZs",
     "!ImportValue",
     "!Join sequence",
     "!Ref",
     "!Select sequence",
     "!Split sequence",
     "!Sub"
   ]
   ```

3. **Save the file** and restart VSCode (`cmd` + `shift` + `P`, then choose “Developer: Reload Windows”) to apply the changes.

## Explanation of Each Custom Tag

Here’s a brief explanation of each custom tag added:

- `!Equals sequence` - Compares two values and returns `true` if they are equal.
- `!FindInMap sequence` - Returns the value corresponding to keys in a two-level map declared in the `Mappings` section.
- `!GetAtt` - Returns the value of an attribute from a specified resource.
- `!GetAZs` - Returns an array of Availability Zones for a specified region.
- `!ImportValue` - Imports values that are exported from another stack.
- `!Join sequence` - Joins a list of values into a single value, separated by a specified delimiter.
- `!Ref` - Returns the value of the specified parameter or resource.
- `!Select sequence` - Returns a single object from a list of objects by index.
- `!Split sequence` - Splits a string into a list of values based on a specified delimiter.
- `!Sub` - Substitutes variables in an input string with values that you specify.
