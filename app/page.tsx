"use client";

import { useState } from "react";
import {
  ArrowRight,
  Zap,
  Shield,
  Brain,
  Database,
  CheckCircle,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Cleaning",
      description:
        "Automatically detect and fix data inconsistencies using advanced machine learning algorithms.",
      color: "#cba6f7",
    },
    {
      icon: Shield,
      title: "Smart Validation",
      description:
        "Real-time validation with intelligent error detection and suggested corrections.",
      color: "#a6e3a1",
    },
    {
      icon: Database,
      title: "Multi-Format Support",
      description:
        "Handle CSV, XLSX, and JSON files with seamless format conversion and optimization.",
      color: "#fab387",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Process thousands of records in seconds with our optimized data processing engine.",
      color: "#f9e2af",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Data Analyst at TechCorp",
      content:
        "Data Alchemist saved us 20+ hours per week on data cleaning. The AI suggestions are incredibly accurate.",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Operations Manager",
      content:
        "The validation features caught errors we never would have found manually. Game changer for our workflow.",
      rating: 5,
    },
    {
      name: "Emily Watson",
      role: "Research Director",
      content:
        "Intuitive interface and powerful features. Our team was productive from day one.",
      rating: 5,
    },
  ];

  const stats = [
    { value: "10M+", label: "Records Processed" },
    { value: "99.9%", label: "Accuracy Rate" },
    { value: "500+", label: "Happy Customers" },
    { value: "24/7", label: "Support Available" },
  ];

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4]">
      {/* Navigation */}
      <nav className="border-b border-[#313244] bg-[#181825]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#cba6f7] text-[#1e1e2e]">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#f38ba8]">
                  Data Alchemist
                </h1>
                <p className="text-xs text-[#6c7086]">Transform Your Data</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/app">
                <Button className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90">
                  Launch App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#cba6f7]/10 via-transparent to-[#f38ba8]/10" />
        <div className="max-w-7xl mx-auto px-6 py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-[#cba6f7]/20 text-[#cba6f7] border-[#cba6f7]/30">
              ✨ AI-Powered Data Processing
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#f38ba8] via-[#cba6f7] to-[#a6e3a1] bg-clip-text text-transparent">
              Transform Messy Data Into Gold
            </h1>
            <p className="text-xl text-[#6c7086] mb-8 max-w-2xl mx-auto leading-relaxed">
              Clean, validate, and optimize your CSV and XLSX files with
              AI-powered precision. Turn hours of manual work into minutes of
              automated excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button
                  size="lg"
                  className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90 text-lg px-8 py-6"
                >
                  Start Cleaning Data
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-[#45475a] text-[#cdd6f4] hover:bg-[#313244] text-lg px-8 py-6"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f38ba8] mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-[#6c7086] max-w-2xl mx-auto">
              Everything you need to transform your data processing workflow
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-[#313244] border-[#45475a] hover:border-[#585b70] transition-all duration-300 cursor-pointer group"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardHeader className="pb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300"
                    style={{
                      backgroundColor:
                        hoveredFeature === index
                          ? feature.color
                          : `${feature.color}20`,
                    }}
                  >
                    <feature.icon
                      className="h-6 w-6 transition-colors duration-300"
                      style={{
                        color:
                          hoveredFeature === index ? "#1e1e2e" : feature.color,
                      }}
                    />
                  </div>
                  <CardTitle className="text-[#cdd6f4] group-hover:text-[#f38ba8] transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[#6c7086] leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#181825]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f38ba8] mb-4">
              How It Works
            </h2>
            <p className="text-xl text-[#6c7086] max-w-2xl mx-auto">
              Three simple steps to clean, perfect data
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Your Files",
                description:
                  "Drag and drop your CSV or XLSX files. We support multiple formats and large datasets.",
                icon: Database,
              },
              {
                step: "02",
                title: "AI Analysis & Cleaning",
                description:
                  "Our AI automatically detects issues, suggests fixes, and validates your data in real-time.",
                icon: Brain,
              },
              {
                step: "03",
                title: "Export Clean Data",
                description:
                  "Download your cleaned, validated data ready for analysis or import into any system.",
                icon: CheckCircle,
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-[#cba6f7] rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-8 w-8 text-[#1e1e2e]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#f38ba8] rounded-full flex items-center justify-center text-[#1e1e2e] font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#cdd6f4] mb-3">
                  {item.title}
                </h3>
                <p className="text-[#6c7086] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f38ba8] mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-[#6c7086] max-w-2xl mx-auto">
              Join thousands of professionals who trust Data Alchemist
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-[#313244] border-[#45475a]">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-[#f9e2af] text-[#f9e2af]"
                      />
                    ))}
                  </div>
                  <CardDescription className="text-[#cdd6f4] text-base leading-relaxed">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#cba6f7] rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-[#1e1e2e]" />
                    </div>
                    <div>
                      <div className="font-medium text-[#cdd6f4]">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-[#6c7086]">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#cba6f7]/10 via-[#f38ba8]/10 to-[#a6e3a1]/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#f38ba8] mb-6">
            Ready to Transform Your Data?
          </h2>
          <p className="text-xl text-[#6c7086] mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have streamlined their data
            workflows with Data Alchemist.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button
                size="lg"
                className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/90 text-lg px-8 py-6"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-[#45475a] text-[#cdd6f4] hover:bg-[#313244] text-lg px-8 py-6"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-[#6c7086] mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#313244] bg-[#181825] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cba6f7] text-[#1e1e2e]">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#f38ba8]">Data Alchemist</h3>
                </div>
              </div>
              <p className="text-[#6c7086] text-sm">
                Transform your data processing workflow with AI-powered cleaning
                and validation.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-[#cdd6f4] mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-[#6c7086]">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    API
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#cdd6f4] mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-[#6c7086]">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#cdd6f4] mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-[#6c7086]">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#cdd6f4] transition-colors"
                  >
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#313244] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#6c7086] text-sm">
              © 2024 Data Alchemist. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-[#6c7086] hover:text-[#cdd6f4] text-sm transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-[#6c7086] hover:text-[#cdd6f4] text-sm transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-[#6c7086] hover:text-[#cdd6f4] text-sm transition-colors"
              >
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
