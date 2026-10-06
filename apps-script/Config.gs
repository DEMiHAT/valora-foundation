// Generated from src/data/events.ts. Rebuild after event configuration changes.
var VALORA_EVENTS = [
  {
    "id": "valora-mun-2026",
    "slug": "valora-mun",
    "title": "Valora Model United Nations",
    "shortTitle": "Valora MUN",
    "type": "Conference",
    "date": "2026-11-14T09:00:00+05:30",
    "validUntil": "2026-11-14T23:59:59+05:30",
    "venue": "To be announced",
    "description": "A one-day Model United Nations conference with six committees and two training sessions. Beginners and experienced delegates are welcome.",
    "tagline": "Model United Nations",
    "categoryLabel": "committees",
    "overview": {
      "title": "Debate and diplomacy.",
      "lead": "Represent a country or political perspective, debate policy and negotiate with other delegates.",
      "paragraphs": [
        "Beginners and returning delegates receive general and committee-specific training before the conference.",
        "Join us on 14 November 2026 for a full day of committee participation, supported by two training sessions before the conference."
      ]
    },
    "summaryIncludes": [
      "2 training sessions",
      "Full committee participation",
      "Opening & closing ceremonies",
      "Lunch + 2 refreshments",
      "Complete delegate kit",
      "Official participation certificate"
    ],
    "trainingNote": "One general training session and one committee-specific session are included. Session timings will be shared with registered delegates.",
    "fee": 999,
    "currency": "INR",
    "preferenceCount": 3,
    "fields": [
      {
        "key": "name",
        "label": "Full Name",
        "type": "text",
        "required": true
      },
      {
        "key": "institution",
        "label": "School/Institution",
        "type": "text",
        "required": true
      },
      {
        "key": "class",
        "label": "Class/Grade",
        "type": "text",
        "required": true
      },
      {
        "key": "email",
        "label": "Email",
        "type": "email",
        "required": true
      },
      {
        "key": "phone",
        "label": "Contact Number",
        "type": "tel",
        "required": true
      },
      {
        "key": "experience",
        "label": "MUN experience",
        "type": "select",
        "required": true,
        "options": [
          "Beginner",
          "Intermediate",
          "Experienced"
        ]
      }
    ],
    "allocationRule": "ordered-preferences",
    "idPrefix": "VM26",
    "formEnvKey": "VALORA_MUN_FORM_URL",
    "matrixApprovalEnvKey": "VALORA_MUN_MATRIX_APPROVED",
    "categories": [
      {
        "id": "who",
        "name": "WHO",
        "description": "World Health Organization",
        "capacity": 30,
        "portfolios": [
          "India",
          "United States of America",
          "United Kingdom",
          "France",
          "Japan",
          "China",
          "Russian Federation",
          "Germany",
          "Brazil",
          "South Africa",
          "Canada",
          "Australia",
          "Italy",
          "Mexico",
          "Indonesia",
          "Republic of Korea",
          "Saudi Arabia",
          "Türkiye",
          "Argentina",
          "Nigeria",
          "Egypt",
          "Kenya",
          "Pakistan",
          "Bangladesh",
          "Sri Lanka",
          "Nepal",
          "United Arab Emirates",
          "Norway",
          "Sweden",
          "Switzerland"
        ]
      },
      {
        "id": "unga",
        "name": "UNGA",
        "description": "United Nations General Assembly",
        "capacity": 30,
        "portfolios": [
          "India",
          "United States of America",
          "United Kingdom",
          "France",
          "Japan",
          "China",
          "Russian Federation",
          "Germany",
          "Brazil",
          "South Africa",
          "Canada",
          "Australia",
          "Italy",
          "Mexico",
          "Indonesia",
          "Republic of Korea",
          "Saudi Arabia",
          "Türkiye",
          "Argentina",
          "Nigeria",
          "Egypt",
          "Kenya",
          "Pakistan",
          "Bangladesh",
          "Sri Lanka",
          "Nepal",
          "United Arab Emirates",
          "Norway",
          "Sweden",
          "Switzerland"
        ]
      },
      {
        "id": "unhrc",
        "name": "UNHRC",
        "description": "United Nations Human Rights Council",
        "capacity": 30,
        "portfolios": [
          "India",
          "United States of America",
          "United Kingdom",
          "France",
          "Japan",
          "China",
          "Russian Federation",
          "Germany",
          "Brazil",
          "South Africa",
          "Canada",
          "Australia",
          "Italy",
          "Mexico",
          "Indonesia",
          "Republic of Korea",
          "Saudi Arabia",
          "Türkiye",
          "Argentina",
          "Nigeria",
          "Egypt",
          "Kenya",
          "Pakistan",
          "Bangladesh",
          "Sri Lanka",
          "Nepal",
          "United Arab Emirates",
          "Norway",
          "Sweden",
          "Switzerland"
        ]
      },
      {
        "id": "lok-sabha",
        "name": "Lok Sabha",
        "description": "House of the People",
        "capacity": 30,
        "portfolios": [
          "Prime Minister",
          "Minister of Home Affairs",
          "Minister of Defence",
          "Minister of Finance",
          "Minister of External Affairs",
          "Minister of Education",
          "Minister of Health and Family Welfare",
          "Minister of Environment, Forest and Climate Change",
          "Minister of Law and Justice",
          "Minister of Women and Child Development",
          "Minister of Agriculture and Farmers Welfare",
          "Minister of Labour and Employment",
          "Minister of Rural Development",
          "Minister of Social Justice and Empowerment",
          "Minister of Tribal Affairs",
          "Minister of Road Transport and Highways",
          "Minister of Railways",
          "Minister of Commerce and Industry",
          "Minister of Communications",
          "Minister of Housing and Urban Affairs",
          "Leader of the Opposition",
          "Deputy Leader of the Opposition",
          "Opposition Spokesperson: Education",
          "Opposition Spokesperson: Health",
          "Opposition Spokesperson: Finance",
          "Opposition Spokesperson: Environment",
          "Opposition Spokesperson: Agriculture",
          "Opposition Spokesperson: Social Justice",
          "Independent Member: Urban Constituency",
          "Independent Member: Rural Constituency"
        ]
      },
      {
        "id": "aippm",
        "name": "AIPPM",
        "description": "All India Political Parties Meet",
        "capacity": 30,
        "portfolios": [
          "Bharatiya Janata Party: Representative 1",
          "Indian National Congress: Representative 1",
          "Aam Aadmi Party: Representative 1",
          "All India Trinamool Congress: Representative 1",
          "Dravida Munnetra Kazhagam: Representative 1",
          "All India Anna Dravida Munnetra Kazhagam: Representative 1",
          "Samajwadi Party: Representative 1",
          "Bahujan Samaj Party: Representative 1",
          "Communist Party of India (Marxist): Representative 1",
          "Communist Party of India: Representative 1",
          "Nationalist Congress Party: Representative 1",
          "Shiv Sena: Representative 1",
          "Rashtriya Janata Dal: Representative 1",
          "Janata Dal (United): Representative 1",
          "Telugu Desam Party: Representative 1",
          "YSR Congress Party: Representative 1",
          "Biju Janata Dal: Representative 1",
          "Bharat Rashtra Samithi: Representative 1",
          "Shiromani Akali Dal: Representative 1",
          "Jharkhand Mukti Morcha: Representative 1",
          "National Conference: Representative 1",
          "Peoples Democratic Party: Representative 1",
          "Indian Union Muslim League: Representative 1",
          "All India Majlis-e-Ittehadul Muslimeen: Representative 1",
          "Janata Dal (Secular): Representative 1",
          "Rashtriya Lok Dal: Representative 1",
          "Apna Dal (Sonelal): Representative 1",
          "Bharatiya Janata Party: Representative 2",
          "Indian National Congress: Representative 2",
          "Independent Political Representative"
        ]
      },
      {
        "id": "unfccc",
        "name": "UNFCCC",
        "description": "United Nations Framework Convention on Climate Change",
        "capacity": 30,
        "portfolios": [
          "India",
          "United States of America",
          "United Kingdom",
          "France",
          "Japan",
          "China",
          "Russian Federation",
          "Germany",
          "Brazil",
          "South Africa",
          "Canada",
          "Australia",
          "Italy",
          "Mexico",
          "Indonesia",
          "Republic of Korea",
          "Saudi Arabia",
          "Türkiye",
          "Argentina",
          "Nigeria",
          "Egypt",
          "Kenya",
          "Pakistan",
          "Bangladesh",
          "Sri Lanka",
          "Nepal",
          "United Arab Emirates",
          "Norway",
          "Sweden",
          "Switzerland"
        ]
      }
    ],
    "includes": [
      {
        "title": "Learn before you lead",
        "items": [
          "1 general MUN training session",
          "1 committee-specific training session"
        ]
      },
      {
        "title": "The full conference",
        "items": [
          "Opening and closing ceremonies",
          "Full committee participation"
        ]
      },
      {
        "title": "Food & refreshments",
        "items": [
          "Lunch",
          "2 snack / refreshment servings"
        ]
      },
      {
        "title": "Your delegate kit",
        "items": [
          "Biodegradable pen, notebook and file",
          "Placard and delegate ID card"
        ]
      },
      {
        "title": "Recognition",
        "items": [
          "Official participation certificate"
        ]
      }
    ],
    "faqs": [
      {
        "question": "Is this my first MUN? Am I welcome?",
        "answer": "Absolutely. Beginners are welcome, and your fee includes a general MUN training session and a committee-specific session to help you prepare."
      },
      {
        "question": "How are committees and portfolios assigned?",
        "answer": "Choose your committee preferences in the registration form. After your payment is verified, we check your choices in order and assign the next available portfolio. If all choices are full, our team will arrange an allocation."
      },
      {
        "question": "Where will the conference take place?",
        "answer": "The venue is to be announced. Confirmed details will be shared on this page and with registered delegates."
      },
      {
        "question": "How do I pay?",
        "answer": "Register on this website and pay securely through Razorpay using the payment methods available at checkout. Your payment is confirmed automatically."
      },
      {
        "question": "When will I receive my delegate ID?",
        "answer": "After payment verification and committee allocation, your digital Valora E-ID will be issued with a secure verification QR."
      },
      {
        "question": "Can I choose a country or portfolio?",
        "answer": "You can indicate your committee preferences. Portfolios are assigned in the predefined committee sequence and cannot be requested through the form."
      },
      {
        "question": "What are the cancellation and refund terms?",
        "answer": "The cancellation and refund policy is displayed on the registration page before payment. Please review it along with the event terms before registering."
      }
    ]
  }
];
