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
      text: "
      - [**Evolving Many-Model Problem Solvers**](StephenKelly_GPT.pdf) 
        \n*August 2024*  
        \n*Authors: Ali Naqvi, Stephen Kelly*
        \n*Accepted as ALIFE2024 Workshop Paper
      \n\n
      - [**Towards Evolving Creative Algorithms: Musical Time Series Forecasting with Tangled Program Graphs**](uploads/towards_creativity.pdf)  
        \n*July 2024*  
        \n*Authors: Stephen Kelly, Eddie Zhuang, Ali Naqvi, Tanya Djavaherpour*
        \n*Accepted as GPTP2024 Book Chapter 
      \n\n
      - **Improving Efficiency of Indexed Memory for Tangled Program Graphs**
        \n*July 2024*  
        \n*Authors: Tanya Djavaherpour, Ali Naqvi, Stephen Kelly*
        \n*Submitted to ECTA 2024 as Position Paper"
      filters:
        exclude_featured: false
---