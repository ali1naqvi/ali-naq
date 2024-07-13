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
      view: citation

    - block: collection
    id: contact
    widget: contact
    content:
      autolink: true
      title: Contact
      links:
        - icon: at-symbol
          url: 'mailto:alinaqvi8014@gmail.com'
          label: E-mail Me
        - icon: brands/x
          url: https://twitter.com/1NaqviAli
        - icon: brands/github
          url: https://github.com/ali1naqvi
        - icon: brands/linkedin
          url: https://www.linkedin.com/in/ali-naqvi-8b514b1b5/
    design:
      columns: '2'

---
