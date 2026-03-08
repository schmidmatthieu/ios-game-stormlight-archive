// ─── Class-Specific Side Quests & Act Info ─────────────────────────
// Extracted from QuestManager to keep files small.

import type { Quest, ChampionClass } from '../data/types';

// ─── Act Narrative Info ─────────────────────────────────────────
export const ACT_INFO: Record<number, { name: string; subtitle: string; description: string }> = {
  1: {
    name: 'Acte I — L\'Éveil',
    subtitle: 'Le Salteur s\'éveille',
    description: 'Vous découvrez que vous êtes un Salteur, capable de voyager entre les mondes du Cosmere. Maîtrisez la magie de Scadrial et Roshar pour révéler votre véritable destin.',
  },
  2: {
    name: 'Acte II — Les Éclats',
    subtitle: 'La chasse aux fragments',
    description: 'Un Éclat a été brisé et ses fragments corrompent les mondes. Traversez Taldain, Komashi, Nalthis et Sel pour récupérer les fragments avant qu\'il ne soit trop tard.',
  },
  3: {
    name: 'Acte III — Convergence',
    subtitle: 'La confrontation finale',
    description: 'Les mondes fusionnent dans Shadesmar. Affrontez la source de la corruption et décidez du sort du Cosmere tout entier.',
  },
};

// ─── Class-Specific Side Quests ──────────────────────────────────
// These quests are only available to the matching class.

export const CLASS_SIDE_QUESTS: Record<ChampionClass, Quest[]> = {
  mistborn: [
    {
      id: 'class_mistborn_1', name: 'L\'Héritage du Survivant',
      description: 'Kelsier a laissé une cache secrète de métaux dans les catacombes de Luthadel. Retrouvez-la et maîtrisez les 8 métaux de base.',
      worldID: 'scadrial', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'scadrial_main_1',
      objectives: [
        { id: 'cm1_1', description: 'Explorer les catacombes', type: 'explore', targetID: 'scadrial_catacombs', requiredCount: 1, currentCount: 0 },
        { id: 'cm1_2', description: 'Collecter les fioles de métaux', type: 'collect', targetID: 'metal_vial_set', requiredCount: 4, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['allomantic_belt'] }, status: 'available',
    },
    {
      id: 'class_mistborn_2', name: 'Le Puits de l\'Ascension',
      description: 'Les brumes s\'épaississent. Un ancien allomancien vous confie que le Puits appelle. Brûlez du cuivre pour déchiffrer les coordonnées.',
      worldID: 'scadrial', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_mistborn_1',
      objectives: [
        { id: 'cm2_1', description: 'Vaincre les gardiens des brumes', type: 'kill', targetID: 'mist_guardian', requiredCount: 5, currentCount: 0 },
        { id: 'cm2_2', description: 'Atteindre le Puits de l\'Ascension', type: 'explore', targetID: 'scadrial_well', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['mist_cloak'] }, status: 'locked',
    },
  ],
  radiant: [
    {
      id: 'class_radiant_1', name: 'Le Lien du Spren',
      description: 'Votre spren vous pousse à explorer les ruines de Natanatan. Renforcez votre lien en prononçant les Idéaux perdus.',
      worldID: 'roshar', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'roshar_main_1',
      objectives: [
        { id: 'cr1_1', description: 'Méditer aux Ruines de Natanatan', type: 'explore', targetID: 'roshar_natanatan', requiredCount: 1, currentCount: 0 },
        { id: 'cr1_2', description: 'Vaincre les sprens corrompus', type: 'kill', targetID: 'corrupted_spren', requiredCount: 4, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['stormlight_sphere'] }, status: 'available',
    },
    {
      id: 'class_radiant_2', name: 'Les Plaines Brisées',
      description: 'Un plateau de gemcœur a été repéré dans les Plaines Brisées. Affrontez les Parshendis pour le récupérer.',
      worldID: 'roshar', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_radiant_1',
      objectives: [
        { id: 'cr2_1', description: 'Traverser les Plaines Brisées', type: 'explore', targetID: 'roshar_shattered_plains', requiredCount: 1, currentCount: 0 },
        { id: 'cr2_2', description: 'Vaincre le champion Parshendi', type: 'defeat', targetID: 'parshendi_champion', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['shardblade_shard'] }, status: 'locked',
    },
  ],
  awakener: [
    {
      id: 'class_awakener_1', name: 'Couleurs Vivantes',
      description: 'Un maître de T\'Telir cherche un apprenti pour apprendre l\'art d\'éveiller les objets. Collectez des Souffles dans les marchés.',
      worldID: 'nalthis', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'nalthis_main_1',
      objectives: [
        { id: 'ca1_1', description: 'Parler au maître Éveilleur', type: 'talkTo', targetID: 'awakener_master', requiredCount: 1, currentCount: 0 },
        { id: 'ca1_2', description: 'Collecter des Souffles', type: 'collect', targetID: 'breath_essence', requiredCount: 5, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['chromatic_cloak'] }, status: 'available',
    },
    {
      id: 'class_awakener_2', name: 'Le Tonnerre Noir',
      description: 'L\'épée Tonnerre Noir a été aperçue. Retrouvez cet artefact avant qu\'il ne tombe en de mauvaises mains.',
      worldID: 'nalthis', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_awakener_1',
      objectives: [
        { id: 'ca2_1', description: 'Traquer les voleurs de Souffle', type: 'kill', targetID: 'breath_thief', requiredCount: 4, currentCount: 0 },
        { id: 'ca2_2', description: 'Retrouver le Tonnerre Noir', type: 'collect', targetID: 'nightblood_shard', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['awakened_blade'] }, status: 'locked',
    },
  ],
  elantrian: [
    {
      id: 'class_elantrian_1', name: 'Les Aons Perdus',
      description: 'Trois Aons anciens ont été effacés des murs d\'Elantris. Parcourez la cité pour les retrouver et restaurer le Dor.',
      worldID: 'sel', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'sel_main_1',
      objectives: [
        { id: 'ce1_1', description: 'Retrouver les glyphes effacés', type: 'collect', targetID: 'lost_aon', requiredCount: 3, currentCount: 0 },
        { id: 'ce1_2', description: 'Purifier l\'Aon corrompu', type: 'defeat', targetID: 'corrupted_seon', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['aon_scroll'] }, status: 'available',
    },
    {
      id: 'class_elantrian_2', name: 'Le Dor Déchaîné',
      description: 'Le Dor afflue de façon incontrôlée. Sceller les fissures dimensionnelles avant qu\'Elantris ne soit engloutie.',
      worldID: 'sel', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_elantrian_1',
      objectives: [
        { id: 'ce2_1', description: 'Sceller les fissures du Dor', type: 'explore', targetID: 'sel_rift', requiredCount: 3, currentCount: 0 },
        { id: 'ce2_2', description: 'Vaincre l\'entité du Dor', type: 'defeat', targetID: 'dor_entity', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['dor_staff'] }, status: 'locked',
    },
  ],
  sandMaster: [
    {
      id: 'class_sandmaster_1', name: 'Les Sables de la Maîtrise',
      description: 'Les aînés vous testent : traversez le Désert de Kerzt seul et prouvez votre contrôle du sable en affrontant les créatures des dunes.',
      worldID: 'taldain', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'taldain_main_1',
      objectives: [
        { id: 'cs1_1', description: 'Traverser le Désert de Kerzt', type: 'explore', targetID: 'taldain_kerzt', requiredCount: 1, currentCount: 0 },
        { id: 'cs1_2', description: 'Vaincre les vers des sables', type: 'kill', targetID: 'sand_worm', requiredCount: 3, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['sand_whip'] }, status: 'available',
    },
    {
      id: 'class_sandmaster_2', name: 'L\'Oasis Cachée',
      description: 'Une source d\'eau ancienne se cache sous les dunes. Trouvez-la pour restaurer vos pouvoirs au maximum.',
      worldID: 'taldain', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_sandmaster_1',
      objectives: [
        { id: 'cs2_1', description: 'Trouver l\'oasis cachée', type: 'explore', targetID: 'taldain_oasis', requiredCount: 1, currentCount: 0 },
        { id: 'cs2_2', description: 'Purifier la source', type: 'defeat', targetID: 'sand_guardian', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['enchanted_gourd'] }, status: 'locked',
    },
  ],
  nightmarePainter: [
    {
      id: 'class_painter_1', name: 'Encre et Cauchemars',
      description: 'Les cauchemars envahissent la ville de Kilahito. Utilisez votre don de peintre pour les capturer avant qu\'ils ne prennent forme physique.',
      worldID: 'komashi', type: 'side', actNumber: 1, requiredLevel: 2, requiredQuestID: 'komashi_main_1',
      objectives: [
        { id: 'cp1_1', description: 'Capturer les cauchemars errants', type: 'kill', targetID: 'nightmare_shade', requiredCount: 5, currentCount: 0 },
        { id: 'cp1_2', description: 'Parler au Peintre aîné', type: 'talkTo', targetID: 'elder_painter', requiredCount: 1, currentCount: 0 },
      ],
      rewards: { xp: 150, gold: 80, itemIDs: ['nightmare_brush'] }, status: 'available',
    },
    {
      id: 'class_painter_2', name: 'Le Cauchemar Éternel',
      description: 'Un cauchemar ancien menace de consumer tout Kilahito. Seul un vrai Peintre peut le bannir définitivement.',
      worldID: 'komashi', type: 'side', actNumber: 2, requiredLevel: 6, requiredQuestID: 'class_painter_1',
      objectives: [
        { id: 'cp2_1', description: 'Affronter le Cauchemar Éternel', type: 'defeat', targetID: 'eternal_nightmare', requiredCount: 1, currentCount: 0 },
        { id: 'cp2_2', description: 'Collecter l\'encre de bannissement', type: 'collect', targetID: 'banishment_ink', requiredCount: 3, currentCount: 0 },
      ],
      rewards: { xp: 300, gold: 150, itemIDs: ['ancestral_brush'] }, status: 'locked',
    },
  ],
};
