import React from 'react'
import { BoxesLoader  } from "react-awesome-loaders-py3";
import "./Loader.css"
export default function Loader() {
    return (
        <div>
            <BoxesLoader
        boxColor={"#6366F1"}
        style={{ marginBottom: "20px" }}
        desktopSize={"128px"}
        mobileSize={"80px"}
        className="hello"
      />
            <h1>It's Loading</h1>
        </div>
    )
}
