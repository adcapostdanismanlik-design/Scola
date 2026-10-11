// Bağımlılıksız JSON dosya deposu. Tek süreçli yerel pilot için tasarlandı:
// tüm yazmalar sırayla yapılır ve dosyaya atomik (geçici dosya + rename) kaydedilir.
// Çok süreçli / çok sunuculu kurulumda bunun yerine gerçek bir veritabanı
// (ör. PostgreSQL + benzersiz kısıtlar) kullanılmalıdır.
import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';

const empty=()=>({version:1,users:[],sessions:[],submissions:[],reviews:[],xpEvents:[],conflicts:[],tasks:[],escrow:[],surveys:[],hubReports:[],mentorships:[],treeApps:[],forests:[],stageEvents:[],treeConflicts:[],auditLog:[]});

export function openDb(file){
  let data=empty();
  if(file&&existsSync(file)){
    const loaded=JSON.parse(readFileSync(file,'utf8'));
    data={...data,...loaded};
  }
  const persist=()=>{
    if(!file)return;
    mkdirSync(path.dirname(file),{recursive:true});
    const tmp=file+'.tmp';
    writeFileSync(tmp,JSON.stringify(data,null,1));
    renameSync(tmp,file);
  };
  // Senkron işlem: Node tek iş parçacıklı olduğu için fonksiyon içinde başka
  // istek araya giremez. Hata atılırsa bellek durumu geri alınır.
  const tx=fn=>{
    const snapshot=JSON.stringify(data);
    try{const result=fn(data);persist();return result}
    catch(e){data=JSON.parse(snapshot);throw e}
  };
  return {get data(){return data},tx};
}
