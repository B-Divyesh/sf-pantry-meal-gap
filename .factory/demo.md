# Demo sandbox

- URL: `https://pantry-meal-gap.sociobot.in/demo/` (or `/?demo=1`)
- The landing action **Try it with sample data** opens the same sandbox in one click.
- The sample includes ten pantry items, two ready meals, three missing shopping items, and one recent meal choice. It immediately shows a realistic meal match and populated list.
- Demo state uses IndexedDB database `demo:pantry-meal-gap`. Real data uses the separate `pantry-meal-gap` database. Demo code never reads or writes the real database.
- **Reset demo** replaces only the demo database with the shipped sample. **Start for real** deletes the demo database and opens a fresh real workspace.
- The demo works offline after its first successful visit, just like the real workspace.
