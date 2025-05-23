"use client";

import { AppContainer } from "@/components/app/AppContainer";
import { GridLayout } from "@/components/app/GridLayout";

export default function App() {
    return (
        <div className="h-screen w-full">
            <GridLayout>
                <AppContainer />
            </GridLayout>
        </div>
    );
}
