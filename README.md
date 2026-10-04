# DUET - Digital Twin Framework

DUET is an advanced digital twin framework featuring adaptive neural mirroring and parallel consciousness streams. It uses the Gemini API to simulate a persona's cognitive structure, biases, and worldview.

## Features

- **Cognitive Profiling**: Analyzes ideological structures, linguistic patterns, and intellectual blindspots.
- **Neural Mirroring**: High-fidelity simulation of specific personas using Gemini 1.5 Pro.
- **Knowledgebase Ingestion**: Dynamically update the twin's context with web links or text fragments.
- **Conceptual Sketching**: Abstract visual descriptions generated via Gemini's multimodal capabilities.

## Prerequisites

- **Node.js**: Version 18 or higher.
- **Gemini API Key**: Obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd duet
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## Deployment to Vercel

To deploy DUET to Vercel, follow these steps:

1. **Push your code to a GitHub repository**.
2. **Log in to [Vercel](https://vercel.com)** and click "New Project".
3. **Import your repository**.
4. **Configure Environment Variables**:
   - In the "Environment Variables" section, add:
     - Key: `GEMINI_API_KEY`
     - Value: `your_api_key_here`
5. **Click "Deploy"**.

Vercel will automatically detect the Vite configuration and build the project.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI**: Google Gemini API (@google/genai)
- **Animations**: Framer Motion
- **Build Tool**: Vite

## License

MIT
