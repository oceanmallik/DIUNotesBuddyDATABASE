const fs = require('fs');
const path = require('path');

// Configuration
const REPO_OWNER = 'oceanmallik';
const REPO_NAME = 'DIUNotesBuddyDATABASE';
const BASE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/`;

// NEW: An array of all departments your app supports!
const DEPARTMENTS = [
    'Software Engineering', 
    'Information Technology Management'
];

const makeId = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '-');

function buildManifest() {
    const manifest = {
        version: "2.0",
        lastUpdated: new Date().toISOString().split('T')[0],
        departments: [] // NEW: This holds everything now
    };

    // 1. Loop through Departments
    DEPARTMENTS.forEach(deptName => {
        const deptPath = path.join(__dirname, deptName);
        
        // If the folder doesn't exist yet on GitHub, it safely skips it
        if (!fs.existsSync(deptPath)) return; 

        const deptObj = { 
            id: makeId(deptName), 
            title: deptName, 
            years: [] 
        };

        // 2. Loop through Years
        const years = fs.readdirSync(deptPath).filter(f => fs.statSync(path.join(deptPath, f)).isDirectory());
        years.forEach(yearName => {
            const yearObj = { id: makeId(yearName), label: yearName, semesters: [] };
            const yearPath = path.join(deptPath, yearName);

            // 3. Loop through Semesters
            const semesters = fs.readdirSync(yearPath).filter(f => fs.statSync(path.join(yearPath, f)).isDirectory());
            semesters.forEach(semName => {
                const semObj = { id: makeId(semName), label: semName, subjects: [] };
                const semPath = path.join(yearPath, semName);

                // 4. Loop through Subjects
                const subjects = fs.readdirSync(semPath).filter(f => fs.statSync(path.join(semPath, f)).isDirectory());
                subjects.forEach(subFolderName => {
                    const [subId, ...titleParts] = subFolderName.split('_');
                    const subTitle = titleParts.join('_') || subFolderName;
                    
                    const subObj = { 
                        id: subId, 
                        title: subTitle, 
                        materials: { midterm: [], final: [], assignment: [], presentation: [] } 
                    };
                    const subPath = path.join(semPath, subFolderName);

                    // 5. Loop through Categories
                    const categories = fs.readdirSync(subPath).filter(f => fs.statSync(path.join(subPath, f)).isDirectory());
                    categories.forEach(catName => {
                        const catKey = catName.toLowerCase();
                        const catPath = path.join(subPath, catName);

                        // 6. Loop through Topics
                        const topics = fs.readdirSync(catPath).filter(f => fs.statSync(path.join(catPath, f)).isDirectory());
                        topics.forEach(topicName => {
                            const topicPath = path.join(catPath, topicName);
                            
                            // 7. Get the PDF files
                            const files = fs.readdirSync(topicPath).filter(f => f.endsWith('.pdf'));
                            const fileArray = files.map(fileName => ({
                                filename: fileName,
                                // Dynamically includes the department name in the URL!
                                url: `${BASE_URL}${encodeURI(deptName)}/${encodeURI(yearName)}/${encodeURI(semName)}/${encodeURI(subFolderName)}/${encodeURI(catName)}/${encodeURI(topicName)}/${encodeURI(fileName)}`
                            }));

                            if (fileArray.length > 0) {
                                if (!subObj.materials[catKey]) subObj.materials[catKey] = [];
                                subObj.materials[catKey].push({ topic: topicName, files: fileArray });
                            }
                        });
                    });
                    semObj.subjects.push(subObj);
                });
                yearObj.semesters.push(semObj);
            });
            deptObj.years.push(yearObj);
        });
        manifest.departments.push(deptObj);
    });

    fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log("Successfully generated V2 manifest.json!");
}

buildManifest();
