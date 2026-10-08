// Shared public project registry. Never put webhook URLs or credentials here.
(function(){
  const sites = [
  {
    "id": "buildersbench",
    "name": "BuildersBench",
    "url": "https://www.buildersbench.dev/",
    "category": "Career projects",
    "color": "#4bd6ff"
  },
  {
    "id": "cob",
    "name": "Opportunity Board",
    "url": "https://cob-eta.vercel.app/",
    "repository": "https://github.com/WynwoodDreams/COB",
    "category": "Internships & jobs",
    "color": "#b498ff"
  },
  {
    "id": "arrestintelligence",
    "name": "Arrest Intelligence",
    "url": "https://www.arrestintelligence.com/",
    "repository": "https://github.com/WynwoodDreams/miamiArrest-dashboard",
    "category": "Public data dashboard",
    "color": "#ffbd6b"
  },
  {
    "id": "emriders",
    "name": "EM Riders",
    "url": "https://www.emriders.com/",
    "repository": "https://github.com/WynwoodDreams/Emnova-Prjoect",
    "category": "Motorcycle platform",
    "color": "#4af3d1"
  },
  {
    "id": "mdpd",
    "name": "MDPD Dashboard",
    "url": "https://mdpd-dashboard.vercel.app/",
    "repository": "https://github.com/WynwoodDreams/-mdpd-dashboard",
    "category": "Miami-Dade dashboard",
    "color": "#739bff"
  },
  {
    "id": "environmental",
    "name": "Miami Environmental Intel",
    "url": "https://mia-environmental-intel.vercel.app/",
    "repository": "https://github.com/WynwoodDreams/mia-environmental-intel",
    "category": "Environmental intelligence",
    "color": "#8bd69c"
  }
];
  if(typeof module === "object" && module.exports) module.exports = sites;
  else window.ARENA_SITES = sites;
})();
