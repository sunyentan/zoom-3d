"use client"

import { useState } from "react";

export default function SetupPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        asuId: '',
        major: '',
        graduationYear: ''
      });
    
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };
    
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
    
        // Here you can send the data to a backend or go to next step
      };
    
      return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-center">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-md px-10 py-8 w-full max-w-md"
          >
            <h1 className="text-2xl font-semibold mb-6 text-center">Set Up</h1>
    
            {['firstName', 'lastName', 'asuId', 'major', 'graduationYear'].map((field) => (
              <input
                key={field}
                name={field}
                type="text"
                placeholder={field
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())}
                value={(formData as any)[field]}
                onChange={handleChange}
                className="w-full p-2 mb-4 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
    
            <button
              type="submit"
              className="bg-blue-500 text-white w-full py-2 rounded-md hover:bg-blue-600"
            >
              Continue
            </button>
          </form>
        </div>
    );
  }
  