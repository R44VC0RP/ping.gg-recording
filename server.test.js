import { describe, expect, test } from 'bun:test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, 'config.json');

describe('Server Configuration', () => {
  test('config.json template exists', () => {
    const templateExists = fs.existsSync(join(__dirname, 'template_config.json'));
    expect(templateExists).toBe(true);
  });

  test('template_config.json has correct structure', () => {
    const config = JSON.parse(fs.readFileSync(join(__dirname, 'template_config.json'), 'utf8'));
    expect(config).toHaveProperty('streams');
    expect(config).toHaveProperty('settings');
    expect(config.settings).toHaveProperty('recordingsPath');
    expect(config.settings).toHaveProperty('defaultVideoQuality');
    expect(config.settings.defaultVideoQuality).toHaveProperty('width');
    expect(config.settings.defaultVideoQuality).toHaveProperty('height');
    expect(config.settings.defaultVideoQuality).toHaveProperty('videoBitrate');
    expect(config.settings.defaultVideoQuality).toHaveProperty('audioBitrate');
  });

  test('recordings directory exists or can be created', () => {
    const recordingsPath = join(__dirname, 'recordings');
    if (!fs.existsSync(recordingsPath)) {
      fs.mkdirSync(recordingsPath);
    }
    expect(fs.existsSync(recordingsPath)).toBe(true);
  });
});

describe('Docker Environment', () => {
  test('Dockerfile exists', () => {
    const dockerfileExists = fs.existsSync(join(__dirname, 'Dockerfile'));
    expect(dockerfileExists).toBe(true);
  });

  test('docker-compose.yml exists', () => {
    const dockerComposeExists = fs.existsSync(join(__dirname, 'docker-compose.yml'));
    expect(dockerComposeExists).toBe(true);
  });
});
