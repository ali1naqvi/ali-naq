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
        url: uploads/resume.pdf
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
    content:
      title: Publications
      text: ""
      filters:
        folders:
          - publication
        exclude_featured: false
    design:
      #view: citation
      columns: '2'

  - block: contact
    id: contact
    widget: contact
    content:
      title: Contact
      links:
        - icon: twitter
          url: https://twitter.com/1NaqviAli
          label: Twitter
        - icon: linkedin
          url: https://www.linkedin.com/in/ali-naqvi-8b514b1b5/
          label: LinkedIn
        - icon: github
          url: https://github.com/ali1naqvi
          label: GitHub
    design:
      columns: '1'
---
