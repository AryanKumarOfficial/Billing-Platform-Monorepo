import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"]
})

export const metadata: Metadata = {
    title: "Billing Platform",
    description: "Distributed Microservices Architecture",
    abstract: " production-ready distributed billing platform built with NestJS, gRPC, Consul, and PostgreSQL. This project demonstrates enterprise-grade microservices patterns including service discovery, dynamic load balancing, inter-service orchestration, and JWT authentication",
    keywords: "billing, microservices, NestJS, gRPC, PostgreSQL, Consul, distributed architecture",
    authors: [{name: "Aryan Kumar", url: "https://github.com/aryankumarofficial"}],
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${inter.className} antialiased`}
        >
        {children}
        </body>
        </html>
    );
}
