// CBSE Predefined Syllabus Data (Latest 2025-26 as per NCERT Rationalised Textbooks)
// Structure: class -> subject -> chapters with topics
// NOTE: This follows the rationalised NCERT textbooks

export interface PredefinedTopic {
  name: string;
}

export interface PredefinedChapter {
  chapterNo: number;
  name: string;
  topics: PredefinedTopic[];
}

export interface PredefinedSubject {
  name: string;
  classNumber: number;
  chapters: PredefinedChapter[];
}

// ============================================
// CLASS 9 SYLLABUS (Rationalised 2025-26)
// ============================================

// CBSE Class 9 Mathematics - Rationalised Syllabus (2025-26)
export const CLASS_9_MATHS: PredefinedSubject = {
  name: "Mathematics",
  classNumber: 9,
  chapters: [
    { chapterNo: 1, name: "Number Systems", topics: [{ name: "Review of Number System" }, { name: "Irrational Numbers" }, { name: "Real Numbers and their Decimal Expansions" }, { name: "Operations on Real Numbers" }, { name: "Laws of Exponents for Real Numbers" }] },
    { chapterNo: 2, name: "Polynomials", topics: [{ name: "Polynomials in One Variable" }, { name: "Zeros of a Polynomial" }, { name: "Remainder Theorem" }, { name: "Factorisation of Polynomials" }, { name: "Algebraic Identities" }] },
    { chapterNo: 3, name: "Coordinate Geometry", topics: [{ name: "Cartesian System" }, { name: "Plotting a Point in the Plane" }, { name: "Coordinates of a Point" }] },
    { chapterNo: 4, name: "Linear Equations in Two Variables", topics: [{ name: "Linear Equations" }, { name: "Solution of a Linear Equation" }, { name: "Graph of a Linear Equation" }] },
    { chapterNo: 5, name: "Introduction to Euclid's Geometry", topics: [{ name: "Euclid's Definitions, Axioms and Postulates" }, { name: "Equivalent Versions of Euclid's Fifth Postulate" }] },
    { chapterNo: 6, name: "Lines and Angles", topics: [{ name: "Basic Terms and Definitions" }, { name: "Pairs of Angles" }, { name: "Parallel Lines and a Transversal" }, { name: "Angle Sum Property of a Triangle" }] },
    { chapterNo: 7, name: "Triangles", topics: [{ name: "Congruence of Triangles" }, { name: "Criteria for Congruence (SAS, ASA, SSS, RHS)" }, { name: "Properties of a Triangle" }, { name: "Inequalities in a Triangle" }] },
    { chapterNo: 8, name: "Quadrilaterals", topics: [{ name: "Properties of a Quadrilateral" }, { name: "Types of Quadrilaterals" }, { name: "Properties of a Parallelogram" }, { name: "The Mid-point Theorem" }] },
    { chapterNo: 9, name: "Circles", topics: [{ name: "Circle and its Related Terms" }, { name: "Angle Subtended by a Chord" }, { name: "Perpendicular from Centre to Chord" }, { name: "Cyclic Quadrilaterals" }] },
    { chapterNo: 10, name: "Heron's Formula", topics: [{ name: "Area of a Triangle by Heron's Formula" }, { name: "Application of Heron's Formula" }] },
    { chapterNo: 11, name: "Surface Areas and Volumes", topics: [{ name: "Surface Area of Cuboid, Cube, Cylinder, Cone, Sphere" }, { name: "Volume of Cuboid, Cube, Cylinder, Cone, Sphere" }] },
    { chapterNo: 12, name: "Statistics", topics: [{ name: "Collection and Presentation of Data" }, { name: "Graphical Representation" }, { name: "Mean, Median and Mode" }] },
  ]
};

// CBSE Class 9 Science - Rationalised Syllabus (2025-26)
export const CLASS_9_SCIENCE: PredefinedSubject = {
  name: "Science",
  classNumber: 9,
  chapters: [
    { chapterNo: 1, name: "Matter in Our Surroundings", topics: [{ name: "Physical Nature of Matter" }, { name: "States of Matter" }, { name: "Change of State" }, { name: "Evaporation" }] },
    { chapterNo: 2, name: "Is Matter Around Us Pure", topics: [{ name: "Mixtures" }, { name: "Solutions, Suspensions and Colloids" }, { name: "Separation of Mixtures" }, { name: "Elements and Compounds" }] },
    { chapterNo: 3, name: "Atoms and Molecules", topics: [{ name: "Laws of Chemical Combination" }, { name: "Atoms and Atomic Mass" }, { name: "Molecules and Ions" }, { name: "Writing Chemical Formulae" }] },
    { chapterNo: 4, name: "Structure of the Atom", topics: [{ name: "Thomson's Model" }, { name: "Rutherford's Model" }, { name: "Bohr's Model" }, { name: "Valency, Atomic Number and Mass Number" }, { name: "Isotopes and Isobars" }] },
    { chapterNo: 5, name: "The Fundamental Unit of Life", topics: [{ name: "Cell Theory" }, { name: "Cell Organelles" }, { name: "Plasma Membrane and Cell Wall" }] },
    { chapterNo: 6, name: "Tissues", topics: [{ name: "Plant Tissues" }, { name: "Animal Tissues" }] },
    { chapterNo: 7, name: "Motion", topics: [{ name: "Distance and Displacement" }, { name: "Speed and Velocity" }, { name: "Acceleration" }, { name: "Equations of Motion" }] },
    { chapterNo: 8, name: "Force and Laws of Motion", topics: [{ name: "Balanced and Unbalanced Forces" }, { name: "Newton's Laws of Motion" }, { name: "Conservation of Momentum" }] },
    { chapterNo: 9, name: "Gravitation", topics: [{ name: "Universal Law of Gravitation" }, { name: "Mass and Weight" }, { name: "Buoyancy and Archimedes' Principle" }] },
    { chapterNo: 10, name: "Work and Energy", topics: [{ name: "Work" }, { name: "Kinetic and Potential Energy" }, { name: "Law of Conservation of Energy" }] },
    { chapterNo: 11, name: "Sound", topics: [{ name: "Production and Propagation of Sound" }, { name: "Reflection of Sound" }, { name: "Ultrasound" }] },
    { chapterNo: 12, name: "Improvement in Food Resources", topics: [{ name: "Improvement in Crop Yields" }, { name: "Animal Husbandry" }] },
  ]
};

// CBSE Class 9 Social Science - Rationalised Syllabus (2025-26)
export const CLASS_9_SST: PredefinedSubject = {
  name: "Social Science",
  classNumber: 9,
  chapters: [
    // History
    { chapterNo: 1, name: "The French Revolution", topics: [{ name: "French Society" }, { name: "The Outbreak of the Revolution" }, { name: "Legacy of the French Revolution" }] },
    { chapterNo: 2, name: "Socialism in Europe and the Russian Revolution", topics: [{ name: "Age of Social Change" }, { name: "The Russian Revolution" }] },
    { chapterNo: 3, name: "Nazism and the Rise of Hitler", topics: [{ name: "Birth of Weimar Republic" }, { name: "Hitler's Rise to Power" }, { name: "The Nazi State" }] },
    { chapterNo: 4, name: "Forest Society and Colonialism", topics: [{ name: "Deforestation under Colonial Rule" }, { name: "Rebellion in the Forest" }] },
    { chapterNo: 5, name: "Pastoralists in the Modern World", topics: [{ name: "Pastoral Nomads" }, { name: "Colonial Rule and Pastoral Groups" }] },
    // Geography
    { chapterNo: 6, name: "India - Size and Location", topics: [{ name: "Location and Size" }, { name: "India and the World" }] },
    { chapterNo: 7, name: "Physical Features of India", topics: [{ name: "Major Physiographic Divisions" }, { name: "The Himalayan Mountains" }, { name: "The Northern Plains" }] },
    { chapterNo: 8, name: "Drainage", topics: [{ name: "Himalayan Rivers" }, { name: "Peninsular Rivers" }] },
    { chapterNo: 9, name: "Climate", topics: [{ name: "Indian Monsoon" }, { name: "Distribution of Rainfall" }] },
    { chapterNo: 10, name: "Natural Vegetation and Wild Life", topics: [{ name: "Types of Vegetation" }, { name: "Wild Life Conservation" }] },
    { chapterNo: 11, name: "Population", topics: [{ name: "Population Size and Distribution" }, { name: "Population Composition" }] },
    // Political Science
    { chapterNo: 12, name: "What is Democracy? Why Democracy?", topics: [{ name: "Features of Democracy" }, { name: "Why Democracy?" }] },
    { chapterNo: 13, name: "Constitutional Design", topics: [{ name: "Making of Indian Constitution" }, { name: "Preamble" }, { name: "Fundamental Rights" }] },
    { chapterNo: 14, name: "Electoral Politics", topics: [{ name: "Elections and Democracy" }, { name: "Election Commission" }] },
    { chapterNo: 15, name: "Working of Institutions", topics: [{ name: "Parliament" }, { name: "Executive" }, { name: "Judiciary" }] },
    { chapterNo: 16, name: "Democratic Rights", topics: [{ name: "Fundamental Rights" }, { name: "Right to Constitutional Remedies" }] },
    // Economics
    { chapterNo: 17, name: "The Story of Village Palampur", topics: [{ name: "Organisation of Production" }, { name: "Farming and Non-Farm Activities" }] },
    { chapterNo: 18, name: "People as Resource", topics: [{ name: "Human Capital" }, { name: "Education and Health" }] },
    { chapterNo: 19, name: "Poverty as a Challenge", topics: [{ name: "Poverty Line" }, { name: "Anti-Poverty Measures" }] },
    { chapterNo: 20, name: "Food Security in India", topics: [{ name: "Buffer Stock" }, { name: "Public Distribution System" }] },
  ]
};

// ============================================
// CLASS 10 SYLLABUS (Rationalised 2025-26)
// ============================================

// CBSE Class 10 Mathematics - Rationalised Syllabus (2025-26)
export const CLASS_10_MATHS: PredefinedSubject = {
  name: "Mathematics",
  classNumber: 10,
  chapters: [
    { chapterNo: 1, name: "Real Numbers", topics: [{ name: "Fundamental Theorem of Arithmetic" }, { name: "Irrational Numbers" }, { name: "Decimal Expansions" }] },
    { chapterNo: 2, name: "Polynomials", topics: [{ name: "Zeros of a Polynomial" }, { name: "Relationship between Zeros and Coefficients" }] },
    { chapterNo: 3, name: "Pair of Linear Equations in Two Variables", topics: [{ name: "Graphical Method" }, { name: "Substitution and Elimination Methods" }] },
    { chapterNo: 4, name: "Quadratic Equations", topics: [{ name: "Solution by Factorization" }, { name: "Quadratic Formula" }, { name: "Nature of Roots" }] },
    { chapterNo: 5, name: "Arithmetic Progressions", topics: [{ name: "nth Term of an AP" }, { name: "Sum of First n Terms" }] },
    { chapterNo: 6, name: "Triangles", topics: [{ name: "Similarity of Triangles" }, { name: "Criteria for Similarity" }, { name: "Pythagoras Theorem" }] },
    { chapterNo: 7, name: "Coordinate Geometry", topics: [{ name: "Distance Formula" }, { name: "Section Formula" }] },
    { chapterNo: 8, name: "Introduction to Trigonometry", topics: [{ name: "Trigonometric Ratios" }, { name: "Trigonometric Identities" }] },
    { chapterNo: 9, name: "Some Applications of Trigonometry", topics: [{ name: "Heights and Distances" }] },
    { chapterNo: 10, name: "Circles", topics: [{ name: "Tangent to a Circle" }, { name: "Properties of Tangents" }] },
    { chapterNo: 11, name: "Areas Related to Circles", topics: [{ name: "Area of Sector and Segment" }] },
    { chapterNo: 12, name: "Surface Areas and Volumes", topics: [{ name: "Combination of Solids" }, { name: "Conversion of Solids" }] },
    { chapterNo: 13, name: "Statistics", topics: [{ name: "Mean, Mode, Median of Grouped Data" }] },
    { chapterNo: 14, name: "Probability", topics: [{ name: "Theoretical Probability" }, { name: "Simple Problems" }] },
  ]
};

// CBSE Class 10 Science - Rationalised Syllabus (2025-26)
export const CLASS_10_SCIENCE: PredefinedSubject = {
  name: "Science",
  classNumber: 10,
  chapters: [
    { chapterNo: 1, name: "Chemical Reactions and Equations", topics: [{ name: "Types of Chemical Reactions" }, { name: "Oxidation and Reduction" }, { name: "Corrosion" }] },
    { chapterNo: 2, name: "Acids, Bases and Salts", topics: [{ name: "Properties of Acids and Bases" }, { name: "pH Scale" }, { name: "Salts" }] },
    { chapterNo: 3, name: "Metals and Non-metals", topics: [{ name: "Properties of Metals" }, { name: "Reactivity Series" }, { name: "Extraction of Metals" }] },
    { chapterNo: 4, name: "Carbon and its Compounds", topics: [{ name: "Covalent Bonding" }, { name: "Homologous Series" }, { name: "Chemical Properties" }] },
    { chapterNo: 5, name: "Life Processes", topics: [{ name: "Nutrition" }, { name: "Respiration" }, { name: "Transportation" }, { name: "Excretion" }] },
    { chapterNo: 6, name: "Control and Coordination", topics: [{ name: "Nervous System" }, { name: "Hormones in Human Beings" }] },
    { chapterNo: 7, name: "How do Organisms Reproduce?", topics: [{ name: "Asexual and Sexual Reproduction" }, { name: "Human Reproductive System" }] },
    { chapterNo: 8, name: "Heredity", topics: [{ name: "Mendel's Experiments" }, { name: "Sex Determination" }, { name: "Evolution" }] },
    { chapterNo: 9, name: "Light - Reflection and Refraction", topics: [{ name: "Spherical Mirrors" }, { name: "Lenses" }, { name: "Power of a Lens" }] },
    { chapterNo: 10, name: "Human Eye and Colourful World", topics: [{ name: "Defects of Vision" }, { name: "Dispersion of Light" }] },
    { chapterNo: 11, name: "Electricity", topics: [{ name: "Ohm's Law" }, { name: "Series and Parallel Combinations" }, { name: "Electric Power" }] },
    { chapterNo: 12, name: "Magnetic Effects of Electric Current", topics: [{ name: "Magnetic Field" }, { name: "Electric Motor" }, { name: "Electric Generator" }] },
    { chapterNo: 13, name: "Our Environment", topics: [{ name: "Ecosystem" }, { name: "Ozone Layer" }, { name: "Waste Management" }] },
  ]
};

// CBSE Class 10 Social Science - Rationalised Syllabus (2025-26)
export const CLASS_10_SST: PredefinedSubject = {
  name: "Social Science",
  classNumber: 10,
  chapters: [
    // History
    { chapterNo: 1, name: "The Rise of Nationalism in Europe", topics: [{ name: "French Revolution and the Nation" }, { name: "Making of Germany and Italy" }] },
    { chapterNo: 2, name: "Nationalism in India", topics: [{ name: "Non-Cooperation Movement" }, { name: "Civil Disobedience Movement" }] },
    { chapterNo: 3, name: "The Making of a Global World", topics: [{ name: "Nineteenth Century Global Economy" }, { name: "The Great Depression" }] },
    { chapterNo: 4, name: "The Age of Industrialisation", topics: [{ name: "Industrialization in Colonies" }, { name: "Market for Goods" }] },
    // Geography
    { chapterNo: 5, name: "Resources and Development", topics: [{ name: "Types of Resources" }, { name: "Soil Conservation" }] },
    { chapterNo: 6, name: "Forest and Wildlife Resources", topics: [{ name: "Biodiversity" }, { name: "Conservation" }] },
    { chapterNo: 7, name: "Water Resources", topics: [{ name: "Water Scarcity" }, { name: "Rainwater Harvesting" }] },
    { chapterNo: 8, name: "Agriculture", topics: [{ name: "Types of Farming" }, { name: "Major Crops" }] },
    { chapterNo: 9, name: "Minerals and Energy Resources", topics: [{ name: "Modes of Occurrence" }, { name: "Energy Resources" }] },
    { chapterNo: 10, name: "Manufacturing Industries", topics: [{ name: "Location of Industries" }, { name: "Classification" }] },
    // Political Science
    { chapterNo: 11, name: "Power Sharing", topics: [{ name: "Belgium and Sri Lanka" }, { name: "Forms of Power Sharing" }] },
    { chapterNo: 12, name: "Federalism", topics: [{ name: "Federalism in India" }, { name: "Decentralisation" }] },
    { chapterNo: 13, name: "Gender, Religion and Caste", topics: [{ name: "Gender and Politics" }, { name: "Caste and Politics" }] },
    { chapterNo: 14, name: "Political Parties", topics: [{ name: "National Parties" }, { name: "Challenges to Parties" }] },
    { chapterNo: 15, name: "Outcomes of Democracy", topics: [{ name: "Accountable Government" }, { name: "Economic Development" }] },
    // Economics
    { chapterNo: 16, name: "Development", topics: [{ name: "Human Development Index" }, { name: "Sustainable Development" }] },
    { chapterNo: 17, name: "Sectors of the Indian Economy", topics: [{ name: "Primary, Secondary, Tertiary" }, { name: "Organised and Unorganised" }] },
    { chapterNo: 18, name: "Money and Credit", topics: [{ name: "Money as Medium of Exchange" }, { name: "Formal and Informal Credit" }] },
    { chapterNo: 19, name: "Globalisation and the Indian Economy", topics: [{ name: "What is Globalisation?" }, { name: "Impact on India" }] },
    { chapterNo: 20, name: "Consumer Rights", topics: [{ name: "Consumer Protection Act" }, { name: "Consumer Rights" }] },
  ]
};

// ============================================
// CLASS 11 SYLLABUS (Science Stream)
// ============================================

// CBSE Class 11 Physics - Syllabus (2025-26)
export const CLASS_11_PHYSICS: PredefinedSubject = {
  name: "Physics",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "Units and Measurements", topics: [{ name: "SI Units" }, { name: "Measurement of Length, Mass, Time" }, { name: "Errors and Significant Figures" }, { name: "Dimensions of Physical Quantities" }] },
    { chapterNo: 2, name: "Motion in a Straight Line", topics: [{ name: "Position, Path Length, Displacement" }, { name: "Speed and Velocity" }, { name: "Acceleration" }, { name: "Kinematic Equations" }] },
    { chapterNo: 3, name: "Motion in a Plane", topics: [{ name: "Scalars and Vectors" }, { name: "Projectile Motion" }, { name: "Uniform Circular Motion" }] },
    { chapterNo: 4, name: "Laws of Motion", topics: [{ name: "Newton's Laws of Motion" }, { name: "Conservation of Momentum" }, { name: "Friction" }, { name: "Circular Motion" }] },
    { chapterNo: 5, name: "Work, Energy and Power", topics: [{ name: "Work Done by Force" }, { name: "Kinetic and Potential Energy" }, { name: "Conservation of Energy" }, { name: "Power" }] },
    { chapterNo: 6, name: "System of Particles and Rotational Motion", topics: [{ name: "Centre of Mass" }, { name: "Torque and Angular Momentum" }, { name: "Moment of Inertia" }] },
    { chapterNo: 7, name: "Gravitation", topics: [{ name: "Kepler's Laws" }, { name: "Universal Law of Gravitation" }, { name: "Gravitational Potential Energy" }, { name: "Satellites" }] },
    { chapterNo: 8, name: "Mechanical Properties of Solids", topics: [{ name: "Elastic Behaviour" }, { name: "Stress and Strain" }, { name: "Hooke's Law" }, { name: "Elastic Moduli" }] },
    { chapterNo: 9, name: "Mechanical Properties of Fluids", topics: [{ name: "Pressure" }, { name: "Pascal's Law" }, { name: "Bernoulli's Principle" }, { name: "Viscosity" }] },
    { chapterNo: 10, name: "Thermal Properties of Matter", topics: [{ name: "Temperature and Heat" }, { name: "Thermal Expansion" }, { name: "Specific Heat" }, { name: "Heat Transfer" }] },
    { chapterNo: 11, name: "Thermodynamics", topics: [{ name: "Thermal Equilibrium" }, { name: "First Law of Thermodynamics" }, { name: "Second Law of Thermodynamics" }, { name: "Heat Engines" }] },
    { chapterNo: 12, name: "Kinetic Theory", topics: [{ name: "Molecular Nature of Matter" }, { name: "Kinetic Theory of Gases" }, { name: "Degrees of Freedom" }] },
    { chapterNo: 13, name: "Oscillations", topics: [{ name: "Simple Harmonic Motion" }, { name: "Energy in SHM" }, { name: "Damped Oscillations" }] },
    { chapterNo: 14, name: "Waves", topics: [{ name: "Transverse and Longitudinal Waves" }, { name: "Wave Equation" }, { name: "Sound Waves" }, { name: "Doppler Effect" }] },
  ]
};

// CBSE Class 11 Chemistry - Syllabus (2025-26)
export const CLASS_11_CHEMISTRY: PredefinedSubject = {
  name: "Chemistry",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "Some Basic Concepts of Chemistry", topics: [{ name: "Nature of Matter" }, { name: "Laws of Chemical Combination" }, { name: "Atomic and Molecular Masses" }, { name: "Mole Concept" }] },
    { chapterNo: 2, name: "Structure of Atom", topics: [{ name: "Atomic Models" }, { name: "Quantum Mechanical Model" }, { name: "Electronic Configuration" }] },
    { chapterNo: 3, name: "Classification of Elements and Periodicity", topics: [{ name: "Modern Periodic Table" }, { name: "Periodic Trends" }, { name: "Atomic and Ionic Radii" }] },
    { chapterNo: 4, name: "Chemical Bonding and Molecular Structure", topics: [{ name: "Ionic and Covalent Bonds" }, { name: "VSEPR Theory" }, { name: "Hybridization" }, { name: "Molecular Orbital Theory" }] },
    { chapterNo: 5, name: "Thermodynamics", topics: [{ name: "System and Surroundings" }, { name: "First Law of Thermodynamics" }, { name: "Enthalpy and Entropy" }, { name: "Gibbs Energy" }] },
    { chapterNo: 6, name: "Equilibrium", topics: [{ name: "Chemical Equilibrium" }, { name: "Law of Mass Action" }, { name: "Le Chatelier's Principle" }, { name: "Ionic Equilibrium" }] },
    { chapterNo: 7, name: "Redox Reactions", topics: [{ name: "Oxidation and Reduction" }, { name: "Balancing Redox Reactions" }, { name: "Electrochemical Cells" }] },
    { chapterNo: 8, name: "Hydrogen", topics: [{ name: "Position of Hydrogen" }, { name: "Hydrides" }, { name: "Water and Hydrogen Peroxide" }] },
    { chapterNo: 9, name: "The s-Block Elements", topics: [{ name: "Alkali Metals" }, { name: "Alkaline Earth Metals" }, { name: "Compounds of s-Block Elements" }] },
    { chapterNo: 10, name: "The p-Block Elements", topics: [{ name: "Group 13 Elements" }, { name: "Group 14 Elements" }, { name: "Important Compounds" }] },
    { chapterNo: 11, name: "Organic Chemistry – Some Basic Principles", topics: [{ name: "Classification of Organic Compounds" }, { name: "Nomenclature" }, { name: "Isomerism" }, { name: "Electronic Effects" }] },
    { chapterNo: 12, name: "Hydrocarbons", topics: [{ name: "Alkanes" }, { name: "Alkenes" }, { name: "Alkynes" }, { name: "Aromatic Hydrocarbons" }] },
  ]
};

// CBSE Class 11 Mathematics - Syllabus (2025-26)
export const CLASS_11_MATHS: PredefinedSubject = {
  name: "Mathematics",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "Sets", topics: [{ name: "Sets and their Representations" }, { name: "Types of Sets" }, { name: "Operations on Sets" }] },
    { chapterNo: 2, name: "Relations and Functions", topics: [{ name: "Ordered Pairs" }, { name: "Cartesian Product" }, { name: "Relations" }, { name: "Functions" }] },
    { chapterNo: 3, name: "Trigonometric Functions", topics: [{ name: "Angles and Measurement" }, { name: "Trigonometric Ratios" }, { name: "Trigonometric Identities" }] },
    { chapterNo: 4, name: "Complex Numbers and Quadratic Equations", topics: [{ name: "Complex Numbers" }, { name: "Algebra of Complex Numbers" }, { name: "Quadratic Equations" }] },
    { chapterNo: 5, name: "Linear Inequalities", topics: [{ name: "Linear Inequalities" }, { name: "Graphical Solution" }, { name: "System of Linear Inequalities" }] },
    { chapterNo: 6, name: "Permutations and Combinations", topics: [{ name: "Fundamental Principle of Counting" }, { name: "Permutations" }, { name: "Combinations" }] },
    { chapterNo: 7, name: "Binomial Theorem", topics: [{ name: "Binomial Theorem for Positive Integers" }, { name: "General and Middle Terms" }] },
    { chapterNo: 8, name: "Sequences and Series", topics: [{ name: "Arithmetic Progression" }, { name: "Geometric Progression" }, { name: "Sum of Series" }] },
    { chapterNo: 9, name: "Straight Lines", topics: [{ name: "Slope of a Line" }, { name: "Various Forms of Line Equations" }, { name: "Distance Formula" }] },
    { chapterNo: 10, name: "Conic Sections", topics: [{ name: "Circle" }, { name: "Parabola" }, { name: "Ellipse" }, { name: "Hyperbola" }] },
    { chapterNo: 11, name: "Introduction to Three Dimensional Geometry", topics: [{ name: "Coordinate Axes and Planes" }, { name: "Distance Formula" }, { name: "Section Formula" }] },
    { chapterNo: 12, name: "Limits and Derivatives", topics: [{ name: "Limits" }, { name: "Derivatives" }, { name: "Algebra of Derivatives" }] },
    { chapterNo: 13, name: "Statistics", topics: [{ name: "Measures of Dispersion" }, { name: "Variance and Standard Deviation" }] },
    { chapterNo: 14, name: "Probability", topics: [{ name: "Random Experiments" }, { name: "Events" }, { name: "Axiomatic Approach to Probability" }] },
  ]
};

// CBSE Class 11 Biology - Syllabus (2025-26)
export const CLASS_11_BIOLOGY: PredefinedSubject = {
  name: "Biology",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "The Living World", topics: [{ name: "Diversity in Living World" }, { name: "Taxonomic Categories" }, { name: "Taxonomical Aids" }] },
    { chapterNo: 2, name: "Biological Classification", topics: [{ name: "Five Kingdom Classification" }, { name: "Kingdoms: Monera, Protista, Fungi" }, { name: "Viruses and Viroids" }] },
    { chapterNo: 3, name: "Plant Kingdom", topics: [{ name: "Algae" }, { name: "Bryophytes" }, { name: "Pteridophytes" }, { name: "Gymnosperms and Angiosperms" }] },
    { chapterNo: 4, name: "Animal Kingdom", topics: [{ name: "Basis of Classification" }, { name: "Classification of Animals" }] },
    { chapterNo: 5, name: "Morphology of Flowering Plants", topics: [{ name: "Root, Stem, Leaf" }, { name: "Inflorescence and Flower" }, { name: "Fruit and Seed" }] },
    { chapterNo: 6, name: "Anatomy of Flowering Plants", topics: [{ name: "Tissues" }, { name: "Anatomy of Dicot and Monocot Plants" }] },
    { chapterNo: 7, name: "Structural Organisation in Animals", topics: [{ name: "Animal Tissues" }, { name: "Organ and Organ System" }] },
    { chapterNo: 8, name: "Cell: The Unit of Life", topics: [{ name: "Cell Theory" }, { name: "Prokaryotic and Eukaryotic Cells" }, { name: "Cell Organelles" }] },
    { chapterNo: 9, name: "Biomolecules", topics: [{ name: "Carbohydrates" }, { name: "Proteins" }, { name: "Enzymes" }, { name: "Nucleic Acids" }] },
    { chapterNo: 10, name: "Cell Cycle and Cell Division", topics: [{ name: "Cell Cycle" }, { name: "Mitosis" }, { name: "Meiosis" }] },
    { chapterNo: 11, name: "Transport in Plants", topics: [{ name: "Means of Transport" }, { name: "Transpiration" }, { name: "Uptake and Transport of Minerals" }] },
    { chapterNo: 12, name: "Mineral Nutrition", topics: [{ name: "Essential Minerals" }, { name: "Nitrogen Metabolism" }] },
    { chapterNo: 13, name: "Photosynthesis in Higher Plants", topics: [{ name: "Photosynthesis" }, { name: "Light and Dark Reactions" }, { name: "Factors Affecting Photosynthesis" }] },
    { chapterNo: 14, name: "Respiration in Plants", topics: [{ name: "Cellular Respiration" }, { name: "Glycolysis" }, { name: "Krebs Cycle" }, { name: "Electron Transport Chain" }] },
    { chapterNo: 15, name: "Plant Growth and Development", topics: [{ name: "Growth" }, { name: "Plant Growth Regulators" }, { name: "Photoperiodism and Vernalization" }] },
  ]
};

// ============================================
// CLASS 11 SYLLABUS (Commerce Stream)
// ============================================

// CBSE Class 11 Accountancy - Syllabus (2025-26)
export const CLASS_11_ACCOUNTANCY: PredefinedSubject = {
  name: "Accountancy",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "Introduction to Accounting", topics: [{ name: "Meaning of Accounting" }, { name: "Objectives of Accounting" }, { name: "Basic Accounting Terms" }] },
    { chapterNo: 2, name: "Theory Base of Accounting", topics: [{ name: "Generally Accepted Accounting Principles" }, { name: "Accounting Standards" }, { name: "Double Entry System" }] },
    { chapterNo: 3, name: "Recording of Transactions - I", topics: [{ name: "Source Documents" }, { name: "Accounting Equation" }, { name: "Rules of Debit and Credit" }] },
    { chapterNo: 4, name: "Recording of Transactions - II", topics: [{ name: "Journal" }, { name: "Ledger" }, { name: "Special Purpose Books" }] },
    { chapterNo: 5, name: "Bank Reconciliation Statement", topics: [{ name: "Need for Reconciliation" }, { name: "Preparation of Bank Reconciliation Statement" }] },
    { chapterNo: 6, name: "Trial Balance and Rectification of Errors", topics: [{ name: "Trial Balance" }, { name: "Types of Errors" }, { name: "Rectification of Errors" }] },
    { chapterNo: 7, name: "Depreciation, Provisions and Reserves", topics: [{ name: "Depreciation" }, { name: "Methods of Depreciation" }, { name: "Provisions and Reserves" }] },
    { chapterNo: 8, name: "Financial Statements - I", topics: [{ name: "Trading Account" }, { name: "Profit and Loss Account" }] },
    { chapterNo: 9, name: "Financial Statements - II", topics: [{ name: "Balance Sheet" }, { name: "Adjustments in Financial Statements" }] },
  ]
};

// CBSE Class 11 Business Studies - Syllabus (2025-26)
export const CLASS_11_BUSINESS_STUDIES: PredefinedSubject = {
  name: "Business Studies",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "Business, Trade and Commerce", topics: [{ name: "Concept of Business" }, { name: "Characteristics of Business" }, { name: "Business Risk" }] },
    { chapterNo: 2, name: "Forms of Business Organisation", topics: [{ name: "Sole Proprietorship" }, { name: "Partnership" }, { name: "Joint Hindu Family" }, { name: "Company" }] },
    { chapterNo: 3, name: "Public, Private and Global Enterprises", topics: [{ name: "Private Sector" }, { name: "Public Sector" }, { name: "Global Enterprises" }] },
    { chapterNo: 4, name: "Business Services", topics: [{ name: "Banking" }, { name: "Insurance" }, { name: "Communication Services" }] },
    { chapterNo: 5, name: "Emerging Modes of Business", topics: [{ name: "E-Business" }, { name: "Outsourcing" }] },
    { chapterNo: 6, name: "Social Responsibility and Business Ethics", topics: [{ name: "Social Responsibility" }, { name: "Business Ethics" }] },
    { chapterNo: 7, name: "Formation of a Company", topics: [{ name: "Promotion" }, { name: "Incorporation" }, { name: "Commencement of Business" }] },
    { chapterNo: 8, name: "Sources of Business Finance", topics: [{ name: "Owner's Funds" }, { name: "Borrowed Funds" }] },
    { chapterNo: 9, name: "Small Business", topics: [{ name: "Small Scale Industries" }, { name: "Government Assistance" }] },
    { chapterNo: 10, name: "Internal Trade", topics: [{ name: "Wholesale Trade" }, { name: "Retail Trade" }] },
  ]
};

// CBSE Class 11 Economics - Syllabus (2025-26)
export const CLASS_11_ECONOMICS: PredefinedSubject = {
  name: "Economics",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "Introduction to Statistics", topics: [{ name: "Meaning of Statistics" }, { name: "Scope and Importance" }] },
    { chapterNo: 2, name: "Collection of Data", topics: [{ name: "Sources of Data" }, { name: "Methods of Collecting Data" }] },
    { chapterNo: 3, name: "Organisation of Data", topics: [{ name: "Classification" }, { name: "Frequency Distribution" }] },
    { chapterNo: 4, name: "Presentation of Data", topics: [{ name: "Textual Presentation" }, { name: "Tabular Presentation" }, { name: "Diagrammatic Presentation" }] },
    { chapterNo: 5, name: "Measures of Central Tendency", topics: [{ name: "Mean" }, { name: "Median" }, { name: "Mode" }] },
    { chapterNo: 6, name: "Measures of Dispersion", topics: [{ name: "Range" }, { name: "Mean Deviation" }, { name: "Standard Deviation" }] },
    { chapterNo: 7, name: "Correlation", topics: [{ name: "Meaning of Correlation" }, { name: "Methods of Correlation" }] },
    { chapterNo: 8, name: "Index Numbers", topics: [{ name: "Meaning of Index Numbers" }, { name: "Construction of Index Numbers" }] },
    { chapterNo: 9, name: "Introduction to Microeconomics", topics: [{ name: "Meaning of Economics" }, { name: "Central Problems of an Economy" }] },
    { chapterNo: 10, name: "Consumer's Equilibrium", topics: [{ name: "Utility Analysis" }, { name: "Indifference Curve Analysis" }] },
    { chapterNo: 11, name: "Demand", topics: [{ name: "Law of Demand" }, { name: "Elasticity of Demand" }] },
  ]
};

// ============================================
// CLASS 11 SYLLABUS (Arts/Humanities Stream)
// ============================================

// CBSE Class 11 History - Syllabus (2025-26)
export const CLASS_11_HISTORY: PredefinedSubject = {
  name: "History",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "Writing and City Life", topics: [{ name: "Mesopotamia" }, { name: "Urbanisation" }, { name: "Writing" }] },
    { chapterNo: 2, name: "An Empire Across Three Continents", topics: [{ name: "Roman Empire" }, { name: "Political Evolution" }] },
    { chapterNo: 3, name: "Nomadic Empires", topics: [{ name: "Genghis Khan" }, { name: "Mongol Empire" }] },
    { chapterNo: 4, name: "The Three Orders", topics: [{ name: "Feudalism" }, { name: "Social Structure" }] },
    { chapterNo: 5, name: "Changing Cultural Traditions", topics: [{ name: "Renaissance" }, { name: "Humanism" }] },
    { chapterNo: 6, name: "Displacing Indigenous People", topics: [{ name: "European Expansion" }, { name: "Native Americans" }] },
    { chapterNo: 7, name: "Paths to Modernisation", topics: [{ name: "Industrial Revolution" }, { name: "Modernisation" }] },
  ]
};

// CBSE Class 11 Political Science - Syllabus (2025-26)
export const CLASS_11_POLITICAL_SCIENCE: PredefinedSubject = {
  name: "Political Science",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "Constitution: Why and How?", topics: [{ name: "Why a Constitution?" }, { name: "Making of Indian Constitution" }] },
    { chapterNo: 2, name: "Rights in the Indian Constitution", topics: [{ name: "Fundamental Rights" }, { name: "Directive Principles" }] },
    { chapterNo: 3, name: "Election and Representation", topics: [{ name: "Election System" }, { name: "Election Commission" }] },
    { chapterNo: 4, name: "Executive", topics: [{ name: "President" }, { name: "Prime Minister" }, { name: "Council of Ministers" }] },
    { chapterNo: 5, name: "Legislature", topics: [{ name: "Parliament" }, { name: "State Legislature" }] },
    { chapterNo: 6, name: "Judiciary", topics: [{ name: "Supreme Court" }, { name: "High Courts" }, { name: "Judicial Review" }] },
    { chapterNo: 7, name: "Federalism", topics: [{ name: "Centre-State Relations" }, { name: "Local Government" }] },
    { chapterNo: 8, name: "Local Government", topics: [{ name: "Panchayati Raj" }, { name: "Municipalities" }] },
    { chapterNo: 9, name: "Political Theory: An Introduction", topics: [{ name: "What is Politics?" }, { name: "Political Theory" }] },
    { chapterNo: 10, name: "Liberty", topics: [{ name: "Meaning of Liberty" }, { name: "Types of Liberty" }] },
    { chapterNo: 11, name: "Equality", topics: [{ name: "Meaning of Equality" }, { name: "Types of Equality" }] },
    { chapterNo: 12, name: "Justice", topics: [{ name: "Meaning of Justice" }, { name: "Types of Justice" }] },
  ]
};

// CBSE Class 11 Geography - Syllabus (2025-26)
export const CLASS_11_GEOGRAPHY: PredefinedSubject = {
  name: "Geography",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "Geography as a Discipline", topics: [{ name: "Meaning of Geography" }, { name: "Branches of Geography" }] },
    { chapterNo: 2, name: "The Origin and Evolution of the Earth", topics: [{ name: "Origin of Earth" }, { name: "Evolution of Earth" }] },
    { chapterNo: 3, name: "Interior of the Earth", topics: [{ name: "Structure of Earth" }, { name: "Discontinuities" }] },
    { chapterNo: 4, name: "Distribution of Oceans and Continents", topics: [{ name: "Continental Drift" }, { name: "Plate Tectonics" }] },
    { chapterNo: 5, name: "Minerals and Rocks", topics: [{ name: "Types of Minerals" }, { name: "Types of Rocks" }] },
    { chapterNo: 6, name: "Geomorphic Processes", topics: [{ name: "Endogenic Forces" }, { name: "Exogenic Forces" }] },
    { chapterNo: 7, name: "Landforms and their Evolution", topics: [{ name: "Fluvial Landforms" }, { name: "Glacial Landforms" }, { name: "Aeolian Landforms" }] },
    { chapterNo: 8, name: "Composition and Structure of Atmosphere", topics: [{ name: "Composition" }, { name: "Structure" }] },
    { chapterNo: 9, name: "Solar Radiation, Heat Balance and Atmosphere", topics: [{ name: "Insolation" }, { name: "Heat Budget" }] },
    { chapterNo: 10, name: "Water in the Atmosphere", topics: [{ name: "Humidity" }, { name: "Precipitation" }] },
    { chapterNo: 11, name: "World Climate and Climate Change", topics: [{ name: "Climate Types" }, { name: "Climate Change" }] },
    { chapterNo: 12, name: "Water (Oceans)", topics: [{ name: "Ocean Relief" }, { name: "Ocean Currents" }] },
  ]
};

// CBSE Class 11 Psychology - Syllabus (2025-26)
export const CLASS_11_PSYCHOLOGY: PredefinedSubject = {
  name: "Psychology",
  classNumber: 11,
  chapters: [
    { chapterNo: 1, name: "What is Psychology?", topics: [{ name: "Definition of Psychology" }, { name: "Branches of Psychology" }] },
    { chapterNo: 2, name: "Methods of Enquiry in Psychology", topics: [{ name: "Observational Method" }, { name: "Experimental Method" }, { name: "Survey Method" }] },
    { chapterNo: 3, name: "The Bases of Human Behaviour", topics: [{ name: "Biological Basis" }, { name: "Cultural Basis" }] },
    { chapterNo: 4, name: "Human Development", topics: [{ name: "Meaning of Development" }, { name: "Stages of Development" }] },
    { chapterNo: 5, name: "Sensory, Attentional and Perceptual Processes", topics: [{ name: "Sensation" }, { name: "Attention" }, { name: "Perception" }] },
    { chapterNo: 6, name: "Learning", topics: [{ name: "Nature of Learning" }, { name: "Theories of Learning" }] },
    { chapterNo: 7, name: "Human Memory", topics: [{ name: "Memory Systems" }, { name: "Forgetting" }] },
    { chapterNo: 8, name: "Thinking", topics: [{ name: "Nature of Thinking" }, { name: "Problem Solving" }, { name: "Decision Making" }] },
    { chapterNo: 9, name: "Motivation and Emotion", topics: [{ name: "Nature of Motivation" }, { name: "Emotions" }] },
  ]
};

// ============================================
// CLASS 12 SYLLABUS (Science Stream)
// ============================================

// CBSE Class 12 Physics - Syllabus (2025-26)
export const CLASS_12_PHYSICS: PredefinedSubject = {
  name: "Physics",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "Electric Charges and Fields", topics: [{ name: "Electric Charge" }, { name: "Coulomb's Law" }, { name: "Electric Field and Field Lines" }] },
    { chapterNo: 2, name: "Electrostatic Potential and Capacitance", topics: [{ name: "Electric Potential" }, { name: "Capacitors" }, { name: "Energy Stored in Capacitor" }] },
    { chapterNo: 3, name: "Current Electricity", topics: [{ name: "Electric Current" }, { name: "Ohm's Law" }, { name: "Kirchhoff's Laws" }, { name: "Wheatstone Bridge" }] },
    { chapterNo: 4, name: "Moving Charges and Magnetism", topics: [{ name: "Magnetic Force" }, { name: "Motion in Magnetic Field" }, { name: "Ampere's Law" }] },
    { chapterNo: 5, name: "Magnetism and Matter", topics: [{ name: "Magnetic Properties" }, { name: "Earth's Magnetism" }, { name: "Permanent Magnets" }] },
    { chapterNo: 6, name: "Electromagnetic Induction", topics: [{ name: "Faraday's Law" }, { name: "Lenz's Law" }, { name: "Self and Mutual Induction" }] },
    { chapterNo: 7, name: "Alternating Current", topics: [{ name: "AC Circuits" }, { name: "LCR Circuits" }, { name: "Transformers" }] },
    { chapterNo: 8, name: "Electromagnetic Waves", topics: [{ name: "Electromagnetic Spectrum" }, { name: "Properties of EM Waves" }] },
    { chapterNo: 9, name: "Ray Optics and Optical Instruments", topics: [{ name: "Reflection and Refraction" }, { name: "Lenses" }, { name: "Optical Instruments" }] },
    { chapterNo: 10, name: "Wave Optics", topics: [{ name: "Wave Theory of Light" }, { name: "Interference" }, { name: "Diffraction" }] },
    { chapterNo: 11, name: "Dual Nature of Radiation and Matter", topics: [{ name: "Photoelectric Effect" }, { name: "de Broglie Waves" }] },
    { chapterNo: 12, name: "Atoms", topics: [{ name: "Atomic Models" }, { name: "Bohr Model" }, { name: "Atomic Spectra" }] },
    { chapterNo: 13, name: "Nuclei", topics: [{ name: "Nuclear Composition" }, { name: "Radioactivity" }, { name: "Nuclear Energy" }] },
    { chapterNo: 14, name: "Semiconductor Electronics", topics: [{ name: "Semiconductors" }, { name: "Diodes" }, { name: "Transistors" }, { name: "Logic Gates" }] },
  ]
};

// CBSE Class 12 Chemistry - Syllabus (2025-26)
export const CLASS_12_CHEMISTRY: PredefinedSubject = {
  name: "Chemistry",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "Solutions", topics: [{ name: "Types of Solutions" }, { name: "Raoult's Law" }, { name: "Colligative Properties" }] },
    { chapterNo: 2, name: "Electrochemistry", topics: [{ name: "Electrochemical Cells" }, { name: "Nernst Equation" }, { name: "Conductance" }, { name: "Batteries" }] },
    { chapterNo: 3, name: "Chemical Kinetics", topics: [{ name: "Rate of Reaction" }, { name: "Order of Reaction" }, { name: "Integrated Rate Laws" }] },
    { chapterNo: 4, name: "The d and f Block Elements", topics: [{ name: "Transition Elements" }, { name: "Lanthanoids" }, { name: "Actinoids" }] },
    { chapterNo: 5, name: "Coordination Compounds", topics: [{ name: "Nomenclature" }, { name: "Isomerism" }, { name: "Bonding Theories" }] },
    { chapterNo: 6, name: "Haloalkanes and Haloarenes", topics: [{ name: "Classification" }, { name: "Nomenclature" }, { name: "SN1 and SN2 Mechanisms" }] },
    { chapterNo: 7, name: "Alcohols, Phenols and Ethers", topics: [{ name: "Preparation and Properties" }, { name: "Uses" }] },
    { chapterNo: 8, name: "Aldehydes, Ketones and Carboxylic Acids", topics: [{ name: "Nomenclature" }, { name: "Reactions" }, { name: "Uses" }] },
    { chapterNo: 9, name: "Amines", topics: [{ name: "Classification" }, { name: "Preparation and Properties" }, { name: "Diazonium Salts" }] },
    { chapterNo: 10, name: "Biomolecules", topics: [{ name: "Carbohydrates" }, { name: "Proteins" }, { name: "Vitamins" }, { name: "Nucleic Acids" }] },
  ]
};

// CBSE Class 12 Mathematics - Syllabus (2025-26)
export const CLASS_12_MATHS: PredefinedSubject = {
  name: "Mathematics",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "Relations and Functions", topics: [{ name: "Types of Relations" }, { name: "Types of Functions" }, { name: "Composition of Functions" }] },
    { chapterNo: 2, name: "Inverse Trigonometric Functions", topics: [{ name: "Definition and Range" }, { name: "Properties" }] },
    { chapterNo: 3, name: "Matrices", topics: [{ name: "Types of Matrices" }, { name: "Operations on Matrices" }, { name: "Transpose and Inverse" }] },
    { chapterNo: 4, name: "Determinants", topics: [{ name: "Properties of Determinants" }, { name: "Area of Triangle" }, { name: "Adjoint and Inverse" }, { name: "Cramer's Rule" }] },
    { chapterNo: 5, name: "Continuity and Differentiability", topics: [{ name: "Continuity" }, { name: "Differentiability" }, { name: "Mean Value Theorems" }] },
    { chapterNo: 6, name: "Application of Derivatives", topics: [{ name: "Rate of Change" }, { name: "Increasing and Decreasing Functions" }, { name: "Maxima and Minima" }] },
    { chapterNo: 7, name: "Integrals", topics: [{ name: "Indefinite Integrals" }, { name: "Definite Integrals" }, { name: "Properties" }] },
    { chapterNo: 8, name: "Application of Integrals", topics: [{ name: "Area Under Curves" }, { name: "Area Between Two Curves" }] },
    { chapterNo: 9, name: "Differential Equations", topics: [{ name: "Formation of Differential Equations" }, { name: "Methods of Solving" }] },
    { chapterNo: 10, name: "Vector Algebra", topics: [{ name: "Types of Vectors" }, { name: "Scalar and Vector Products" }] },
    { chapterNo: 11, name: "Three Dimensional Geometry", topics: [{ name: "Direction Cosines and Ratios" }, { name: "Equation of Line and Plane" }] },
    { chapterNo: 12, name: "Linear Programming", topics: [{ name: "Linear Programming Problems" }, { name: "Graphical Method" }] },
    { chapterNo: 13, name: "Probability", topics: [{ name: "Conditional Probability" }, { name: "Bayes' Theorem" }, { name: "Random Variables" }] },
  ]
};

// CBSE Class 12 Biology - Syllabus (2025-26)
export const CLASS_12_BIOLOGY: PredefinedSubject = {
  name: "Biology",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "Reproduction in Organisms", topics: [{ name: "Asexual Reproduction" }, { name: "Sexual Reproduction" }] },
    { chapterNo: 2, name: "Sexual Reproduction in Flowering Plants", topics: [{ name: "Flower Structure" }, { name: "Pollination" }, { name: "Fertilization" }, { name: "Seed and Fruit" }] },
    { chapterNo: 3, name: "Human Reproduction", topics: [{ name: "Male Reproductive System" }, { name: "Female Reproductive System" }, { name: "Gametogenesis" }, { name: "Fertilization and Implantation" }] },
    { chapterNo: 4, name: "Reproductive Health", topics: [{ name: "Birth Control" }, { name: "STDs" }, { name: "Infertility" }] },
    { chapterNo: 5, name: "Principles of Inheritance and Variation", topics: [{ name: "Mendelian Inheritance" }, { name: "Chromosomal Theory" }, { name: "Linkage and Crossing Over" }] },
    { chapterNo: 6, name: "Molecular Basis of Inheritance", topics: [{ name: "DNA Structure" }, { name: "Replication" }, { name: "Transcription" }, { name: "Translation" }] },
    { chapterNo: 7, name: "Evolution", topics: [{ name: "Origin of Life" }, { name: "Evidence of Evolution" }, { name: "Natural Selection" }] },
    { chapterNo: 8, name: "Human Health and Disease", topics: [{ name: "Pathogens" }, { name: "Immunity" }, { name: "Common Diseases" }] },
    { chapterNo: 9, name: "Strategies for Enhancement in Food Production", topics: [{ name: "Animal Husbandry" }, { name: "Plant Breeding" }] },
    { chapterNo: 10, name: "Microbes in Human Welfare", topics: [{ name: "Microbes in Household" }, { name: "Industrial Products" }, { name: "Sewage Treatment" }] },
    { chapterNo: 11, name: "Biotechnology: Principles and Processes", topics: [{ name: "Recombinant DNA Technology" }, { name: "Tools and Techniques" }] },
    { chapterNo: 12, name: "Biotechnology and its Applications", topics: [{ name: "Applications in Agriculture" }, { name: "Applications in Medicine" }] },
    { chapterNo: 13, name: "Organisms and Populations", topics: [{ name: "Population Attributes" }, { name: "Population Interactions" }] },
    { chapterNo: 14, name: "Ecosystem", topics: [{ name: "Structure and Function" }, { name: "Energy Flow" }, { name: "Nutrient Cycling" }] },
    { chapterNo: 15, name: "Biodiversity and Conservation", topics: [{ name: "Biodiversity" }, { name: "Conservation Strategies" }] },
  ]
};

// ============================================
// CLASS 12 SYLLABUS (Commerce Stream)
// ============================================

// CBSE Class 12 Accountancy - Syllabus (2025-26)
export const CLASS_12_ACCOUNTANCY: PredefinedSubject = {
  name: "Accountancy",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "Accounting for Partnership Firms - Fundamentals", topics: [{ name: "Partnership Deed" }, { name: "Profit Sharing Ratio" }, { name: "Goodwill" }] },
    { chapterNo: 2, name: "Reconstitution of Partnership Firm - Admission", topics: [{ name: "Admission of Partner" }, { name: "New Profit Sharing Ratio" }, { name: "Revaluation of Assets" }] },
    { chapterNo: 3, name: "Reconstitution of Partnership Firm - Retirement/Death", topics: [{ name: "Retirement of Partner" }, { name: "Death of Partner" }] },
    { chapterNo: 4, name: "Dissolution of Partnership Firm", topics: [{ name: "Dissolution" }, { name: "Settlement of Accounts" }] },
    { chapterNo: 5, name: "Accounting for Share Capital", topics: [{ name: "Share and Share Capital" }, { name: "Issue of Shares" }, { name: "Forfeiture of Shares" }] },
    { chapterNo: 6, name: "Issue and Redemption of Debentures", topics: [{ name: "Meaning of Debentures" }, { name: "Issue of Debentures" }, { name: "Redemption" }] },
    { chapterNo: 7, name: "Financial Statements of a Company", topics: [{ name: "Balance Sheet" }, { name: "Statement of Profit and Loss" }] },
    { chapterNo: 8, name: "Analysis of Financial Statements", topics: [{ name: "Comparative Statements" }, { name: "Common Size Statements" }] },
    { chapterNo: 9, name: "Accounting Ratios", topics: [{ name: "Liquidity Ratios" }, { name: "Solvency Ratios" }, { name: "Profitability Ratios" }] },
    { chapterNo: 10, name: "Cash Flow Statement", topics: [{ name: "Meaning and Objective" }, { name: "Preparation of Cash Flow Statement" }] },
  ]
};

// CBSE Class 12 Business Studies - Syllabus (2025-26)
export const CLASS_12_BUSINESS_STUDIES: PredefinedSubject = {
  name: "Business Studies",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "Nature and Significance of Management", topics: [{ name: "Meaning of Management" }, { name: "Functions of Management" }, { name: "Management vs Administration" }] },
    { chapterNo: 2, name: "Principles of Management", topics: [{ name: "Scientific Management" }, { name: "Fayol's Principles" }] },
    { chapterNo: 3, name: "Business Environment", topics: [{ name: "Micro and Macro Environment" }, { name: "Economic Environment" }] },
    { chapterNo: 4, name: "Planning", topics: [{ name: "Meaning of Planning" }, { name: "Types of Plans" }] },
    { chapterNo: 5, name: "Organising", topics: [{ name: "Structure of Organisation" }, { name: "Delegation and Decentralisation" }] },
    { chapterNo: 6, name: "Staffing", topics: [{ name: "Meaning of Staffing" }, { name: "Recruitment and Selection" }, { name: "Training" }] },
    { chapterNo: 7, name: "Directing", topics: [{ name: "Meaning of Directing" }, { name: "Motivation" }, { name: "Leadership" }, { name: "Communication" }] },
    { chapterNo: 8, name: "Controlling", topics: [{ name: "Meaning of Controlling" }, { name: "Process of Controlling" }] },
    { chapterNo: 9, name: "Financial Management", topics: [{ name: "Meaning of Financial Management" }, { name: "Financial Decisions" }, { name: "Capital Structure" }] },
    { chapterNo: 10, name: "Financial Markets", topics: [{ name: "Money Market" }, { name: "Capital Market" }, { name: "Stock Exchange" }] },
    { chapterNo: 11, name: "Marketing Management", topics: [{ name: "Marketing Concept" }, { name: "Marketing Mix" }, { name: "Product, Price, Place, Promotion" }] },
    { chapterNo: 12, name: "Consumer Protection", topics: [{ name: "Consumer Rights" }, { name: "Consumer Protection Act" }] },
  ]
};

// CBSE Class 12 Economics - Syllabus (2025-26)
export const CLASS_12_ECONOMICS: PredefinedSubject = {
  name: "Economics",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "Introduction to Macroeconomics", topics: [{ name: "Meaning of Macroeconomics" }, { name: "Basic Concepts" }] },
    { chapterNo: 2, name: "National Income and Related Aggregates", topics: [{ name: "National Income" }, { name: "Methods of Calculation" }, { name: "GDP and GNP" }] },
    { chapterNo: 3, name: "Money and Banking", topics: [{ name: "Meaning of Money" }, { name: "Functions of Money" }, { name: "Banking System" }, { name: "RBI" }] },
    { chapterNo: 4, name: "Determination of Income and Employment", topics: [{ name: "Aggregate Demand" }, { name: "Aggregate Supply" }, { name: "Equilibrium" }] },
    { chapterNo: 5, name: "Government Budget and the Economy", topics: [{ name: "Government Budget" }, { name: "Types of Budget" }, { name: "Fiscal Policy" }] },
    { chapterNo: 6, name: "Open Economy Macroeconomics", topics: [{ name: "Balance of Payments" }, { name: "Foreign Exchange Rate" }] },
    { chapterNo: 7, name: "Introduction to Microeconomics", topics: [{ name: "Production Function" }, { name: "Cost and Revenue" }] },
    { chapterNo: 8, name: "Producer Behaviour and Supply", topics: [{ name: "Supply" }, { name: "Elasticity of Supply" }] },
    { chapterNo: 9, name: "Forms of Market and Price Determination", topics: [{ name: "Perfect Competition" }, { name: "Monopoly" }, { name: "Monopolistic Competition" }] },
  ]
};

// ============================================
// CLASS 12 SYLLABUS (Arts/Humanities Stream)
// ============================================

// CBSE Class 12 History - Syllabus (2025-26)
export const CLASS_12_HISTORY: PredefinedSubject = {
  name: "History",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "Bricks, Beads and Bones: The Harappan Civilisation", topics: [{ name: "Discovery of Harappan Civilisation" }, { name: "Town Planning" }, { name: "Economy" }] },
    { chapterNo: 2, name: "Kings, Farmers and Towns: Early States and Economies", topics: [{ name: "Mahajanapadas" }, { name: "Mauryan Empire" }] },
    { chapterNo: 3, name: "Kinship, Caste and Class: Early Societies", topics: [{ name: "Varna System" }, { name: "Social Stratification" }] },
    { chapterNo: 4, name: "Thinkers, Beliefs and Buildings: Cultural Developments", topics: [{ name: "Religious Developments" }, { name: "Architecture" }] },
    { chapterNo: 5, name: "Through the Eyes of Travellers", topics: [{ name: "Al-Biruni" }, { name: "Ibn Battuta" }, { name: "Francois Bernier" }] },
    { chapterNo: 6, name: "Bhakti-Sufi Traditions", topics: [{ name: "Bhakti Movement" }, { name: "Sufism" }] },
    { chapterNo: 7, name: "An Imperial Capital: Vijayanagara", topics: [{ name: "Discovery of Vijayanagara" }, { name: "Architecture" }] },
    { chapterNo: 8, name: "Peasants, Zamindars and the State", topics: [{ name: "Agrarian Society" }, { name: "Revenue System" }] },
    { chapterNo: 9, name: "Kings and Chronicles: The Mughal Courts", topics: [{ name: "Mughal Court" }, { name: "Chronicles" }] },
    { chapterNo: 10, name: "Colonialism and the Countryside", topics: [{ name: "Colonial Rule" }, { name: "Revenue Systems" }] },
    { chapterNo: 11, name: "Rebels and the Raj", topics: [{ name: "Revolt of 1857" }, { name: "Causes and Consequences" }] },
    { chapterNo: 12, name: "Framing the Constitution", topics: [{ name: "Making of Constitution" }, { name: "Features" }] },
  ]
};

// CBSE Class 12 Political Science - Syllabus (2025-26)
export const CLASS_12_POLITICAL_SCIENCE: PredefinedSubject = {
  name: "Political Science",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "The Cold War Era", topics: [{ name: "Cold War" }, { name: "Cuban Missile Crisis" }, { name: "Non-Aligned Movement" }] },
    { chapterNo: 2, name: "The End of Bipolarity", topics: [{ name: "Disintegration of USSR" }, { name: "New World Order" }] },
    { chapterNo: 3, name: "Contemporary Centres of Power", topics: [{ name: "European Union" }, { name: "ASEAN" }, { name: "SAARC" }] },
    { chapterNo: 4, name: "Contemporary South Asia", topics: [{ name: "India and Pakistan" }, { name: "Bangladesh" }, { name: "Sri Lanka" }] },
    { chapterNo: 5, name: "International Organisations", topics: [{ name: "United Nations" }, { name: "Security Council" }] },
    { chapterNo: 6, name: "Security in the Contemporary World", topics: [{ name: "Traditional Security" }, { name: "Non-Traditional Security" }] },
    { chapterNo: 7, name: "Environment and Natural Resources", topics: [{ name: "Environmental Concerns" }, { name: "Resource Politics" }] },
    { chapterNo: 8, name: "Globalisation", topics: [{ name: "Meaning of Globalisation" }, { name: "Impact on India" }] },
    { chapterNo: 9, name: "Challenges of Nation Building", topics: [{ name: "Partition" }, { name: "Integration of Princely States" }] },
    { chapterNo: 10, name: "Era of One-Party Dominance", topics: [{ name: "Congress System" }, { name: "Opposition Parties" }] },
    { chapterNo: 11, name: "Politics of Planned Development", topics: [{ name: "Five Year Plans" }, { name: "Planning Commission" }] },
    { chapterNo: 12, name: "India's External Relations", topics: [{ name: "Non-Alignment" }, { name: "India's Foreign Policy" }] },
    { chapterNo: 13, name: "Challenges to and Restoration of Congress System", topics: [{ name: "Congress Split" }, { name: "Restoration" }] },
    { chapterNo: 14, name: "Rise of Popular Movements", topics: [{ name: "Chipko Movement" }, { name: "Dalit Panthers" }] },
    { chapterNo: 15, name: "Recent Developments in Indian Politics", topics: [{ name: "Coalition Politics" }, { name: "Regional Parties" }] },
  ]
};

// CBSE Class 12 Geography - Syllabus (2025-26)
export const CLASS_12_GEOGRAPHY: PredefinedSubject = {
  name: "Geography",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "Human Geography: Nature and Scope", topics: [{ name: "Definition" }, { name: "Scope" }, { name: "Approaches" }] },
    { chapterNo: 2, name: "The World Population: Distribution, Density and Growth", topics: [{ name: "Population Distribution" }, { name: "Population Growth" }] },
    { chapterNo: 3, name: "Population Composition", topics: [{ name: "Age Structure" }, { name: "Sex Ratio" }, { name: "Literacy" }] },
    { chapterNo: 4, name: "Human Development", topics: [{ name: "HDI" }, { name: "Indicators" }, { name: "Human Poverty Index" }] },
    { chapterNo: 5, name: "Primary Activities", topics: [{ name: "Hunting and Gathering" }, { name: "Agriculture" }, { name: "Mining" }] },
    { chapterNo: 6, name: "Secondary Activities", topics: [{ name: "Manufacturing" }, { name: "Industrial Location" }] },
    { chapterNo: 7, name: "Tertiary and Quaternary Activities", topics: [{ name: "Services" }, { name: "Tourism" }, { name: "Quaternary Services" }] },
    { chapterNo: 8, name: "Transport and Communication", topics: [{ name: "Road Transport" }, { name: "Rail Transport" }, { name: "Air Transport" }] },
    { chapterNo: 9, name: "International Trade", topics: [{ name: "Trade" }, { name: "WTO" }, { name: "Trade Balance" }] },
    { chapterNo: 10, name: "Population: Distribution, Density, Growth and Composition", topics: [{ name: "India's Population" }, { name: "Population Problems" }] },
    { chapterNo: 11, name: "Human Settlements", topics: [{ name: "Rural Settlements" }, { name: "Urban Settlements" }] },
    { chapterNo: 12, name: "Land Resources and Agriculture", topics: [{ name: "Land Use" }, { name: "Agricultural Development" }] },
  ]
};

// CBSE Class 12 Psychology - Syllabus (2025-26)
export const CLASS_12_PSYCHOLOGY: PredefinedSubject = {
  name: "Psychology",
  classNumber: 12,
  chapters: [
    { chapterNo: 1, name: "Variations in Psychological Attributes", topics: [{ name: "Intelligence" }, { name: "Individual Differences" }, { name: "Assessment of Intelligence" }] },
    { chapterNo: 2, name: "Self and Personality", topics: [{ name: "Concept of Self" }, { name: "Personality" }, { name: "Assessment of Personality" }] },
    { chapterNo: 3, name: "Meeting Life Challenges", topics: [{ name: "Stress" }, { name: "Coping Strategies" }, { name: "Promoting Health" }] },
    { chapterNo: 4, name: "Psychological Disorders", topics: [{ name: "Anxiety Disorders" }, { name: "Mood Disorders" }, { name: "Schizophrenia" }] },
    { chapterNo: 5, name: "Therapeutic Approaches", topics: [{ name: "Psychotherapy" }, { name: "CBT" }, { name: "Behaviour Therapy" }] },
    { chapterNo: 6, name: "Attitude and Social Cognition", topics: [{ name: "Attitude Formation" }, { name: "Prejudice" }, { name: "Social Cognition" }] },
    { chapterNo: 7, name: "Social Influence and Group Processes", topics: [{ name: "Conformity" }, { name: "Obedience" }, { name: "Group Dynamics" }] },
    { chapterNo: 8, name: "Psychology and Life", topics: [{ name: "Environmental Psychology" }, { name: "Crowding" }, { name: "Noise Pollution" }] },
    { chapterNo: 9, name: "Developing Psychological Skills", topics: [{ name: "Counselling Skills" }, { name: "Assessment Skills" }] },
  ]
};

// ============================================
// ALL PREDEFINED SYLLABI MAPPING
// ============================================

export const PREDEFINED_SYLLABUS: Record<number, PredefinedSubject[]> = {
  9: [CLASS_9_MATHS, CLASS_9_SCIENCE, CLASS_9_SST],
  10: [CLASS_10_MATHS, CLASS_10_SCIENCE, CLASS_10_SST],
  11: [
    // Science Stream
    CLASS_11_PHYSICS, CLASS_11_CHEMISTRY, CLASS_11_MATHS, CLASS_11_BIOLOGY,
    // Commerce Stream
    CLASS_11_ACCOUNTANCY, CLASS_11_BUSINESS_STUDIES, CLASS_11_ECONOMICS,
    // Arts/Humanities Stream
    CLASS_11_HISTORY, CLASS_11_POLITICAL_SCIENCE, CLASS_11_GEOGRAPHY, CLASS_11_PSYCHOLOGY,
  ],
  12: [
    // Science Stream
    CLASS_12_PHYSICS, CLASS_12_CHEMISTRY, CLASS_12_MATHS, CLASS_12_BIOLOGY,
    // Commerce Stream
    CLASS_12_ACCOUNTANCY, CLASS_12_BUSINESS_STUDIES, CLASS_12_ECONOMICS,
    // Arts/Humanities Stream
    CLASS_12_HISTORY, CLASS_12_POLITICAL_SCIENCE, CLASS_12_GEOGRAPHY, CLASS_12_PSYCHOLOGY,
  ],
};

export const AVAILABLE_CLASSES = Object.keys(PREDEFINED_SYLLABUS).map(Number).sort((a, b) => a - b);

export const getSubjectsForClass = (classNumber: number): PredefinedSubject[] => {
  return PREDEFINED_SYLLABUS[classNumber] || [];
};

export const getAllPredefinedSubjects = (): (PredefinedSubject & { id: string })[] => {
  const subjects: (PredefinedSubject & { id: string })[] = [];
  
  Object.entries(PREDEFINED_SYLLABUS).forEach(([classNum, classSubjects]) => {
    classSubjects.forEach((subject) => {
      subjects.push({
        ...subject,
        id: `class${classNum}_${subject.name.toLowerCase().replace(/\s+/g, '_')}`,
      });
    });
  });
  
  return subjects;
};
