import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config.js';

const config = {
  plugins: [tailwindcss(tailwindConfig), autoprefixer],
};

export default config;
