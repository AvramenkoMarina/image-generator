# AI Image Generator

## Short Explanation
This project is a simple AI-powered image generator. Users can enter a text prompt, and the application generates an image using the [Replicate API](https://replicate.com/) with the model `black-forest-labs/flux-1.1-pro`. The project consists of a React frontend and an Express backend, deployed together.

---
## Demo
https://image-generator-site.onrender.com/

## Features
- Enter a prompt to generate an image.
- View generated images directly in the browser.
- Loading indicator while the image is being generated.
- Fully deployed web app accessible online.

---

## Technical Decisions
- **Express.js** used for backend to handle API requests and serve the React build.
- **React** used for frontend to provide a dynamic, responsive UI.
- **Replicate API** for AI image generation.
- **Vite** used as the React build tool for fast development and production builds.
- Static files served from `client/dist` to simplify deployment.
- `dotenv` for environment variable management.

---

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/AvramenkoMarina/image-generator.git
cd image-generator
