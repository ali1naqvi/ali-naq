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

  - block: markdown
    id: publications
    content:
      title: Publications
      subtitle: ""
      text: |
        1. **Naqvi, A.**, Djavaherpour, T., Vacher, Q., & Kelly, S. (August 2025). Integrating Neuroplasticity into Genetic Programming Agents for Adaptive Decision Making. *2025 Conference on Artificial Life*. (Status: Accepted as Full Paper)

        2. Djavaherpour, T., **Naqvi, A.**, Vacher, Q., Norouziani, F., & Kelly, S. (August 2025). Genetic Encoding and Shared Knowledge in Reinforcement Learning with Structured Memory. *2025 Conference on Artificial Life*. (Status: Accepted as Full Paper)

        3. Vacher, Q., Kelly, S., **Naqvi, A.**, Beuve, N., Djavaherpour, T., Dardaillon, M., & Desnos, K. (January 2025). *The Genetic and Evolutionary Computation Conference*. (Status: Accepted as Full Paper)

        4. Djavaherpour, T., **Naqvi, A.**, Zhuang, E., & Kelly, S. (June 2024). *Genetic Programming Theory & Practice XXI*. (Status: Accepted as Book Chapter)

        5. Djavaherpour, T., **Naqvi, A.**, & Kelly, S. (July 2024). *16th International Conference on Evolutionary Computation Theory and Applications*. (Status: Accepted to Conference)

        6. **Naqvi, A.**, & Kelly, S. (June 2024). *2024 Conference on Artificial Life*. (Status: Accepted as Workshop Paper)
        
---