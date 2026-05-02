const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const os = require('os');

const SKILLS_FILE = path.join(os.homedir(), '.vault-ai-skills.json');

function loadSkills() {
  try {
    if (fs.existsSync(SKILLS_FILE)) {
      return JSON.parse(fs.readFileSync(SKILLS_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveSkills(skills) {
  fs.writeFileSync(SKILLS_FILE, JSON.stringify(skills, null, 2));
}

// GET /api/skills — list custom skills
router.get('/', (req, res) => {
  res.json({ skills: loadSkills() });
});

// POST /api/skills — create custom skill
router.post('/', (req, res) => {
  const { name, icon, desc, prompt } = req.body;
  if (!name || !prompt) return res.status(400).json({ error: 'name and prompt are required' });
  const skills = loadSkills();
  const existing = skills.findIndex(s => s.name === name);
  const skill = {
    id: Date.now().toString(),
    name: name.trim(),
    icon: icon || '⚡',
    desc: desc || '',
    prompt: prompt.trim(),
    custom: true,
    createdAt: new Date().toISOString()
  };
  if (existing >= 0) {
    skills[existing] = { ...skills[existing], ...skill };
  } else {
    skills.push(skill);
  }
  saveSkills(skills);
  res.json({ success: true, skill });
});

// DELETE /api/skills/:id — delete custom skill
router.delete('/:id', (req, res) => {
  const skills = loadSkills();
  const filtered = skills.filter(s => s.id !== req.params.id);
  saveSkills(filtered);
  res.json({ success: true });
});

module.exports = router;
