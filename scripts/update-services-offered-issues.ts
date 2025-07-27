import { Client, Databases, Query } from 'node-appwrite';

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
  .setKey('standard_e992306df3c8114a99875bbc75741906b6706662916743e39f3150347268ef3d44e64330b4732ca2175c2f6bd7a5560304cc9cab9dbaca354533300e6cd94113126862ddafe20c275a0a38f3255559cc1c5ba01fdae0f937e326bebfa0482e4897b7e860be315fe19d984ced4bba5723fe5e19180ec20543ecb6e18c1680ed2e');

const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const SERVICES_OFFERED = 'services_offered';
const ISSUES = 'issues';

// Map common short names to the correct issue name in the issues collection
const issueNameMap: Record<string, string> = {
  'Charging Port': 'Charging Port Repair',
  'Battery': 'Battery Replacement',
  'Camera': 'Camera Repair',
  'Software': 'Software Issue',
  'Screen Replacement': 'Screen Replacement',
  // Add more mappings as needed
};

async function updateServiceIssues() {
  // 1. Fetch all issues
  const issuesRes = await databases.listDocuments(
    DATABASE_ID,
    ISSUES,
    [Query.limit(1000)]
  );
  const validIssues = issuesRes.documents.map((doc: any) => doc.name);

  // 2. Fetch all services_offered
  const servicesRes = await databases.listDocuments(
    DATABASE_ID,
    SERVICES_OFFERED,
    [Query.limit(1000)]
  );

  let updated = 0;
  for (const service of servicesRes.documents) {
    const current = service.issue;
    let newIssue = issueNameMap[current] || current;
    // If not in map, try to find a close match in validIssues
    if (!validIssues.includes(newIssue)) {
      const found = validIssues.find(
        (i) => i.toLowerCase().replace(/[^a-z]/g, '') === current.toLowerCase().replace(/[^a-z]/g, '')
      );
      if (found) newIssue = found;
    }
    if (newIssue !== current && validIssues.includes(newIssue)) {
      await databases.updateDocument(
        DATABASE_ID,
        SERVICES_OFFERED,
        service.$id,
        { issue: newIssue }
      );
      console.log(`Updated service ${service.$id}: '${current}' -> '${newIssue}'`);
      updated++;
    }
  }
  console.log(`Done. Updated ${updated} services.`);
}

updateServiceIssues().catch(console.error); 