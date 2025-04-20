
export function getUniqueNameInList(name: string, existingNames: string[]): string {
  let candidateName = name;
  let counter = 1;
  
  while (existingNames.includes(candidateName)) {
    candidateName = `${name} (${counter})`;
    counter++;
  }
  
  return candidateName;
}
