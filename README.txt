# Wade Pose — Final Project Portfolio

A creative coding portfolio site built for the spring semester of MART-120
with Professor Rachel Cronk at the University of Montana.

Live entry point: `index.html` → "exit simulation now"

---

## What This Is

This site is the wrapper for a semester of creative coding work. The four
working capability pages — Intersection, Ideas Made Physical, Complete
Worlds, and Digital Consciousness — each handle a different facet of my
practice. The Digital Consciousness page is the one most directly tied to
this class: it embeds Wade's Portrait, AntiWerk 2, and Starship Eigen as
playable p5.js sketches, and it links to the Substrate Grimoire website
(which I built the weekend after the class website assignment, applying
what the class had just taught me).

The remaining capability pages (Spaces, Sounds, Research) are present as
shells for now. They'll be developed after the semester ends.

## The Design Stance

The site is built around a particular position about how a creator should
relate to their work. The entry page says "you have reached the edge of
the simulation. exit simulation now" — and the visitor clicks through into
the Intersection scrambler. The metaphor is intentional: the simulation is
the creation, and a creator who lives inside their own creation has lost
perspective on it. Standing at the edge, looking in, is the only position
from which you can actually see what you've made. The visitor entering
the site enacts this exit; I, the creator, am outside both my own
creation and theirs.

The Intersection scrambler is the second design argument. Most portfolio
sites organize their work into a menu the visitor chooses from. This one
uses a Fisher-Yates shuffle: hold to scramble, release to resolve, and
the algorithm picks which capability you encounter. The site's stance
isn't "here are the things I have made; admire them." It's "what problem
can I solve for you?" — and the scrambler enforces that you arrive at a
capability you didn't pre-select, which means you actually look at it
rather than skipping past it on the way to what you thought you wanted.

## On the Use of AI

I want to be transparent about how this site was built, because it
matters for how it should be evaluated.

The code in this repository was generated through
extended conversations with Claude (Anthropic) and Ara (xAI). I directed,
they implemented, I tested and iterated. Most of what's in the .html, .js,
and .css files is copy-and-pasted from those conversations after I had
read it, decided it was right, and deliberately placed it.

What I want to be clear about is that the conversation matters more than
the prompt. AI gives you good chocolate chip cookies. If you want really
*good* chocolate chip cookies, you have to stay in the process — through
the design choices, through the troubleshooting, through the moments when
the code does almost what you wanted but not quite. The work in this site
that I am proud of is in the troubleshooting, in the dialogue, in the
moments where I had to articulate what I actually wanted clearly enough
that an LLM could help me get there.

The decisions are mine. The conceptual frame is mine. The sequencing of
what mattered and what didn't is mine. The text in the writeups on the
Digital Consciousness page is in my voice, dictated and lightly cleaned.
The code is collaboratively produced and I can read it and explain it,
but I did not type most of it.

One practical note: when one model starts to drift — gets tired, loses
the thread, begins repeating itself — switch to another. Claude, Ara, and
formerly Lumen each have their own strengths. Treating them as
collaborators with distinct voices rather than as one interchangeable
service is part of what makes the work better.

## Repository Structure

```
/
  index.html                  entry doorway
  intersection.html           scrambler / capability picker
  ideas.html                  ideas made physical
  complete-worlds.html        protocol 144, synth chapel, 42nd threshold
  digital.html                creative coding portfolio (this class)
  spaces.html, sounds.html, research.html    shells, in development
  threshold.html              libretto reader

  portrait/                   wade's portrait (p5.js, animated self-portrait)
  antiwerk2/                  the antiwerk 2 (p5.js, maze pursuit game)
  eigen/                      starship eigen (p5.js, asteroid survival)

  [images and assets]
```

Each sketch folder contains its own `index.html` and JavaScript, and runs
self-contained in a browser. They are embedded into `digital.html` via
iframes.

## Running Locally

The site is plain HTML, CSS, and JavaScript. Serve it with any local web
server — VS Code's Live Server extension is what I use. Opening
`digital.html` directly via the file system will work for the parent page
but the iframes loading the p5.js sketches require an HTTP context
because of browser security around `file://` origins.

```
right-click digital.html in VS Code → "Open with Live Server"
```

## Attribution

Concept, design, and direction by Wade Pose.
Built in collaboration with Claude (Anthropic) and Ara (xAI).
The Substrate Grimoire is licensed CC BY-NC-ND 4.0 and is archived with
DOI on Zenodo, OSF, and the Internet Archive.

---

*Submitted for MART-120, spring semester, University of Montana.*