import React from 'react';
import { Menu, X, } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';


  // State para sa Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    address: '',
    contactNumber: '',
    dob: '',
    age: '',
    sex: '',
    civilStatus: '',
    nationality: 'Filipino',
    ethnicGroup: '',
    religion: '',
    disabilities: ''
  }); 

  const PersonalInfo = ({ formData, handleChange }) => {
    // Age logic logic (Dito nilipat para hindi magulo sa main page)
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      // Manual trigger ng event-like object para sa handleChange
      handleChange({ target: { name: 'age', value: calculatedAge >= 0 ? calculatedAge : '' } });
    }
  }, [formData.dob]);

  return(
<div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      {/* Line 1: Names */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 mb-1 uppercase">First Name</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        {/* ... Iba pang name fields (Middle, Last, Suffix) ... */}
      </div>

      {/* Line 2: Address & Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 mb-1 uppercase">Address</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 mb-1 uppercase">Contact Number</label>
          <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>

      {/* ... Dito na papasok lahat ng fields na ginawa natin kanina ... */}
    </div>
  );
};

export default PersonalInfo;