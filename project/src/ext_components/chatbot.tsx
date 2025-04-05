"use client"

import { useState } from "react"
import { ChevronUpIcon, ChevronDownIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function ChatBot() {
    const [isOpen, setisOpen] = useState(false)

    return (
        <div className="w-full">
            <Collapsible
                open={isOpen}
                onOpenChange={setisOpen}
            >
                <CollapsibleTrigger className="w-full bg-gray-300 rounded-md p-2 mb-2">
                    <div className="flex text-right">
                        <ChevronUpIcon />
                    </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    CHAT HERE
                </CollapsibleContent>

            </Collapsible>
        </div>
    )
}