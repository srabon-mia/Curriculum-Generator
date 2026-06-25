# Phase 0: Locked Scope

## Subject
NYS Regents **Physical Setting/Chemistry** — the legacy 10-topic Core Curriculum
(Standard 4), NOT the new NYSSLS-aligned "Physical Science: Chemistry" exam that
starts June 2026. Deliberately choosing the older framework because there is
dramatically more available material for it: years of past Regents exams, Jmap
topic-tagged problem banks, review books, and YouTube content all target this
10-topic structure. Source of truth: NYSED Physical Setting/Chemistry Core
Curriculum (chemist.pdf).

NOTE: the new exam still exists and is what's officially administered going
forward. For v1, we are deliberately building for the OLD framework given
resource availability -- this is the explicit trade-off Shafiq chose.

## Why this curriculum, not generated from scratch
NYSED has already done the hard pedagogical work here too: ten clearly defined
topic areas (Appendix A), each broken into individually-numbered "major
understandings" (e.g. 3.1a, 3.1b...) cross-referenced to specific skills and
real-world connections (Appendix B, the Content Connections Table). This is
arguably an even better fit for a resource-curation tool than the new exam's
claims structure, because it naturally decomposes into many small, specific
nodes -- exactly the granularity needed to attach individual curated resources.

NYSED explicitly states the ten topic areas "may be used for ease in
curriculum writing; however, they do not connote a suggested scope and
sequence" -- meaning NYSED itself leaves topic ORDERING up to the local
teacher/curriculum-writer. That gives Shafiq legitimate license to sequence
these topics for harder/specialized-HS pacing without contradicting the
source curriculum.

## Depth target
Regents *structure* (the 10 topics, their major understandings) stays as
published. Resource *rigor* and topic SEQUENCING is tutoring/specialized-HS
level — harder problems, deeper derivations, less rote memorization, ordered
however makes most pedagogical sense for advanced students — curated by a
human (Shafiq) per node. NYSED explicitly permits this since it declined to
mandate a sequence itself.

## Target user (v1)
Shafiq's own tutoring students taking this course at a specialized HS.

## Source document
NYSED Physical Setting/Chemistry Core Curriculum
https://www.nysed.gov/sites/default/files/programs/curriculum-instruction/chemist.pdf

## The 10 topic areas (top-level curriculum nodes), as published by NYSED (Appendix A)
1. Atomic Concepts
2. Periodic Table
3. Moles/Stoichiometry
4. Chemical Bonding
5. Physical Behavior of Matter
6. Kinetics/Equilibrium
7. Organic Chemistry
8. Oxidation-Reduction
9. Acids, Bases, and Salts
10. Nuclear Chemistry

Each topic contains several individually-numbered "major understandings"
(e.g. I.1, I.2... for Atomic Concepts) cross-referenced via key codes
(e.g. 3.1a) to specific testable skills and real-world connections in
Appendix B. These major understandings are the natural sub-node / resource-
attachment granularity -- see seed_curriculum.json.

Lab requirement (real, worth surfacing in the product later): 1200 minutes
of laboratory experience with satisfactory reports on file is a prerequisite
for admission to the exam, plus a separate lab performance test.

## What Phase 0 deliverables look like
1. This scope doc (done)
2. `seed_curriculum.json` — the 10 topics + their major understandings,
   hand-transcribed from the NYSED Core Curriculum, structured to match
   our future `nodes` table schema
3. `domain_scorelist.json` — reputation-scored source domains for chemistry
   content specifically, now including Jmap and other resources specific to
   the OLD exam format (which is where most available material actually is)
