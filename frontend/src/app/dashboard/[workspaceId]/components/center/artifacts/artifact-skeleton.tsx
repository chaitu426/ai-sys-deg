'use client';

import { motion } from 'framer-motion';

export function ArtifactSkeleton() {
    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="border-primary border-l-4 py-1 pl-6">
                <div className="h-10 w-64 bg-muted animate-pulse rounded-lg mb-4" />
                <div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
            </div>

            <div className="space-y-8 mt-12">
                <div className="bg-card border-border rounded-2xl border p-8 space-y-6 shadow-sm">
                    <div className="h-6 w-48 bg-muted animate-pulse rounded-md" />
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
                        <div className="h-4 w-[90%] bg-muted animate-pulse rounded-md" />
                        <div className="h-4 w-[95%] bg-muted animate-pulse rounded-md" />
                    </div>
                </div>

                <div className="bg-card border-border rounded-2xl border p-8 space-y-6 shadow-sm">
                    <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-24 bg-muted animate-pulse rounded-xl" />
                        <div className="h-24 bg-muted animate-pulse rounded-xl" />
                        <div className="h-24 bg-muted animate-pulse rounded-xl" />
                        <div className="h-24 bg-muted animate-pulse rounded-xl" />
                    </div>
                </div>

                <div className="bg-card border-border rounded-2xl border p-8 space-y-6 shadow-sm">
                    <div className="h-6 w-56 bg-muted animate-pulse rounded-md" />
                    <div className="space-y-4">
                        <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
                        <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
                        <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
