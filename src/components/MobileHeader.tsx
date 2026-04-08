"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { SideNav } from "./SideNav"
import { cn } from "@/lib/utils"
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

type MobileHeaderProps = {
  role: "TEAM" | "ADMIN"
  teamName?: string
}

export function MobileHeader({ role, teamName }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#060606] border-b border-white/5 sticky top-0 z-50">
      <Link href="/" className="inline-flex items-center gap-3 group">
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--amarelo)] to-[#CC5500] flex items-center justify-center rounded-[8px] shadow-[0_4px_10px_rgba(255,107,0,0.2)]">
          <span className="font-display font-black text-white text-[10px] tracking-tight">FGB</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display font-black text-white text-[10px] tracking-wider uppercase leading-none">Federação</span>
          <span className="font-display font-medium text-[var(--amarelo)] text-[7px] tracking-[0.2em] uppercase mt-0.5 whitespace-nowrap">Gaúcha de Basquete</span>
        </div>
      </Link>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="p-2 text-slate-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </DialogTrigger>
        <DialogContent 
          className="fixed left-0 top-0 bottom-0 right-auto w-[280px] h-screen p-0 border-r border-white/5 bg-[#060606] translate-x-0 outline-none"
          showCloseButton={false}
        >
          <DialogHeader className="p-0">
             <VisuallyHidden.Root>
                <DialogTitle>Menu de Navegação</DialogTitle>
             </VisuallyHidden.Root>
          </DialogHeader>
          
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-6 flex justify-between items-center border-b border-white/5">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--amarelo)] to-[#CC5500] flex items-center justify-center rounded-[8px]">
                    <span className="font-display font-black text-white text-[10px]">FGB</span>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-1 py-4">
                <SideNav 
                    role={role} 
                    teamName={teamName} 
                    className="border-r-0 w-full" 
                    onItemClick={() => setIsOpen(false)}
                />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
