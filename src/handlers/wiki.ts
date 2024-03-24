import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

const ajv = new Ajv();

export function loadWikiFiles(wikiPath: string): Wiki {
  const categories: Category[] = [];
  const pages: WikiData[] = [];

  // Read and parse the JSON file
  const indexFilePath = path.join(wikiPath, 'index.json');
  const data = fs.readFileSync(indexFilePath, 'utf-8');
  const items = JSON.parse(data);

  for (const item of items) {
    const dir = item.directory;
    const fullPath = path.join(wikiPath, dir);

    // Add the directory to the list
    categories.push({
      directory: dir,
      display_name: item.display_name,
      content: item.content,
      fields: item.fields,
      emoji: item.emoji,
      thumbnail: item.thumbnail,
      image: item.image,
    });

    // Check if the directory exists
    if (!fs.existsSync(fullPath)) {
      // If it doesn't exist, create it
      fs.mkdirSync(fullPath);
    }

    // Read JSON page files from the directory
    const pageFiles = fs
      .readdirSync(fullPath)
      .filter(file => file.endsWith('.json'));

    for (const pageFile of pageFiles) {
      const pageData = fs.readFileSync(path.join(fullPath, pageFile), 'utf-8');
      const jsonData: WikiData = JSON.parse(pageData);
      jsonData.page = `${dir}/${jsonData.page}`;
      // Validate the JSON data against the schema
      const validate = ajv.compile(wikiDataSchema);
      const valid = validate(jsonData);

      if (valid) {
        pages.push(jsonData);
      } else {
        console.error(path.join(fullPath, pageFile));
      }
    }
  }

  return {categories, pages};
}

export interface Wiki {
  categories: Category[];
  pages: WikiData[];
}

export interface Category {
  directory: string;
  display_name: string;
  content: string;
  fields: {
    name: string;
    value: string;
    inline: boolean;
  }[];
  emoji: string;
  thumbnail: string;
  image: string;
}

export interface WikiData {
  page: string;
  title: string;
  description: string;
  content: string;
  fields: {
    name: string;
    value: string;
    inline: boolean;
  }[];
  emoji: string;
  thumbnail: string;
  image: string;
}

const wikiDataSchema = {
  type: 'object',
  properties: {
    page: {type: 'string'},
    title: {type: 'string'},
    description: {type: 'string'},
    content: {type: 'string'},
    fields: {type: 'array'},
    emoji: {type: 'string'},
    thumbnail: {type: 'string'},
    image: {type: 'string'},
  },
  required: ['page', 'title', 'description', 'content'],
};
