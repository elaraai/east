# Containers

Data collections for East's JavaScript runtime.
Each type has been designed to fit into the TypeScript/JavaScript ecosystem yet obey East's semantics.

 - `variant` represents a tagged union value with a string tag and an associated data value
 - `SortedSet` obeys the `Set` interface, stores keys in a sorted-btree
 - `SortedMap` obeys the `Map` interface, stores entries in a sorted-btree
