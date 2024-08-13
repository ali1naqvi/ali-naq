---
# Leave the homepage title empty to use the site title
title: Ali Naqvi
type: landing

design:
  # Default section spacing
  spacing: "6rem"

sections:
  - block: resume-biography-3
    content:
      # Choose a user profile to display (a folder name within `content/authors/`)
      username: admin
      text: ""
      # Show a call-to-action button under your biography? (optional)
      button:
        text: Download CV
        url: uploads/CV.pdf
    design:
      css_class: dark
      background:
        color: black
        image:
          # Add your image background to `assets/media/`.
          filename: stacked-peaks.svg
          filters:
            brightness: 1.0
          size: cover
          position: center
          parallax: false

  - block: collection
    id: publications
    widget: text
    content:
      title: Publications
      text: |
        ### **Evolving Many-Model Problem Solvers**  
        *August 2024*  
        *Authors: Ali Naqvi, Stephen Kelly*  
        [Accepted as ALIFE2024 Workshop Paper](StephenKelly_GPT.pdf)

        ### **Towards Evolving Creative Algorithms: Musical Time Series Forecasting with Tangled Program Graphs**  
        *July 2024*  
        *Authors: Stephen Kelly, Eddie Zhuang, Ali Naqvi, Tanya Djavaherpour*  
        [Accepted as GPTP2024 Book Chapter](uploads/towards_creativity.pdf)

        ### **Improving Efficiency of Indexed Memory for Tangled Program Graphs**  
        *July 2024*  
        *Authors: Tanya Djavaherpour, Ali Naqvi, Stephen Kelly*  
        *Submitted to ECTA 2024 as Position Paper*
      filters:
        exclude_featured: false
---