const fs = require('fs');
const path = require('path');

// Configuration
const REPO_OWNER = 'oceanmallik';
const REPO_NAME = 'DIUNotesBuddyDATABASE';
const BASE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/`;
const DEPARTMENT_FOLDER = 'Software Engineering';

// Helper to clean up folder names for IDs (e.g., "1st Year" -> "year-1")
const makeId = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '-');

function buildManifest() {
    const manifest = {
        department: "Software Engineering",
        version: "1.0",
        lastUpdated: new Date().toISOString().split('T')[0],
        years: []
    };

    const deptPath = path.join(__dirname, DEPARTMENT_FOLDER);
    
    if (!fs.existsSync(deptPath)) {
        console.error(`Directory not found: ${DEPARTMENT_FOLDER}`);
        return;
    }

    const years = fs.readdirSync(deptPath).filter(f => fs.statSync(path.join(deptPath, f)).isDirectory());
    years.forEach(yearName => {
        const yearObj = { id: makeId(yearName), label: yearName, semesters: [] };
        const yearPath = path.join(deptPath, yearName);

        const semesters = fs.readdirSync(yearPath).filter(f => fs.statSync(path.join(yearPath, f)).isDirectory());
        semesters.forEach(semName => {
            const semObj = { id: makeId(semName), label: semName, subjects: [] };
            const semPath = path.join(yearPath, semName);

            const subjects = fs.readdirSync(semPath).filter(f => fs.statSync(path.join(semPath, f)).isDirectory());
            subjects.forEach(subFolderName => {
                // Split the folder name (e.g., "swe-111_Computer Fundamentals")
                const [subId, ...titleParts] = subFolderName.split('_');
                const subTitle = titleParts.join('_') || subFolderName;
                
                const subObj = { 
                    id: subId, 
                    title: subTitle, 
                    materials: { midterm: [], final: [], assignment: [], presentation: [] } 
                };
                const subPath = path.join(semPath, subFolderName);

                const categories = fs.readdirSync(subPath).filter(f => fs.statSync(path.join(subPath, f)).isDirectory());
                categories.forEach(catName => {
                    const catKey = catName.toLowerCase();
                    const catPath = path.join(subPath, catName);

                    const topics = fs.readdirSync(catPath).filter(f => fs.statSync(path.join(catPath, f)).isDirectory());
                    topics.forEach(topicName => {
                        const topicPath = path.join(catPath, topicName);
                        
                        // Grab only the PDF files
                        const files = fs.readdirSync(topicPath).filter(f => f.endsWith('.pdf'));
                        const fileArray = files.map(fileName => ({
                            filename: fileName,
                            // Automatically generates the exact raw download link
                            url: `${BASE_URL}${encodeURI(DEPARTMENT_FOLDER)}/${encodeURI(yearName)}/${encodeURI(semName)}/${encodeURI(subFolderName)}/${encodeURI(catName)}/${encodeURI(topicName)}/${encodeURI(fileName)}`
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
        manifest.years.push(yearObj);
    });

    // Write the new JSON over the old one
    fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log("Successfully generated manifest.json!");
}

buildManifest();
