import { Filemanager } from "@svar-ui/react-filemanager";
import "@svar-ui/react-filemanager/all.css";
import { files } from "@/components/filemanager/data";
import { Willow } from "@svar-ui/react-filemanager";

export default function FileManagerUI(){
  return (
    <div className="filemanager">
      <Willow>
        <Filemanager data={files} mode="cards" />
      </Willow>
    </div>
  )
}