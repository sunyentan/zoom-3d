'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    asuId: '',
    major: '',
    graduationYear: '',
    goals: [],
    careerPathways: [],
    courses: []
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('All setup data:', formData);
    // Send to backend or proceed
  };

  return (
    <div className="text-black min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-xl">
        {step === 1 && (
          <div>
            <h1 className="text-xl font-semibold mb-4">Set Up</h1>
            {['firstName', 'lastName', 'asuId', 'major', 'graduationYear'].map((field) => (
              <input
                key={field}
                name={field}
                placeholder={field
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())}
                value={(formData as any)[field]}
                onChange={(e) => updateField(field, e.target.value)}
                className="w-full p-2 mb-4 border border-gray-200 rounded-md"
              />
            ))}
            <button onClick={nextStep} className="w-full bg-blue-500 text-white py-2 rounded-md">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-xl font-semibold mb-4">Specify a goal</h1>
            {['Website Development', 'Website Designer', 'Software Developer'].map((goal) => (
              <div key={goal}>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.goals.includes(goal)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...formData.goals, goal]
                        : formData.goals.filter(g => g !== goal);
                      updateField('goals', updated);
                    }}
                  />
                  {goal}
                </label>
              </div>
            ))}
            <button onClick={nextStep} className="w-full bg-blue-500 text-white py-2 rounded-md mt-4">Continue</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-xl font-semibold mb-4">Career Pathways</h1>
            {['Web Developer', 'Software Developer', 'Information Security Analyst'].map((pathway) => (
              <button
                key={pathway}
                onClick={() => {
                  const alreadySelected = formData.careerPathways.includes(pathway);
                  const updated = alreadySelected
                    ? formData.careerPathways.filter(p => p !== pathway)
                    : [...formData.careerPathways, pathway];
                  updateField('careerPathways', updated);
                }}
                className={`px-3 py-1 mr-2 mb-2 rounded-full border ${
                  formData.careerPathways.includes(pathway) ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                {pathway}
              </button>
            ))}
            <button onClick={nextStep} className="w-full bg-blue-500 text-white py-2 rounded-md mt-4">Continue</button>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="text-xl font-semibold mb-4">Classes You Are Taking Spring 2025</h1>
            <input
              placeholder="Course Code"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                  e.preventDefault();
                  updateField('courses', [...formData.courses, e.currentTarget.value.trim()]);
                  e.currentTarget.value = '';
                }
              }}
              className="w-full p-2 mb-4 border border-gray-200 rounded-md"
            />
            <ul className="mb-4">
              {formData.courses.map((course, i) => (
                <li key={i} className="flex justify-between items-center border-b py-1">
                  {course}
                  <button
                    onClick={() => updateField('courses', formData.courses.filter((_, j) => j !== i))}
                    className="text-red-500 text-sm"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={handleSubmit} className="w-full bg-blue-500 text-white py-2 rounded-md">Finish</button>
          </div>
        )}
      </div>
    </div>
  );
}
