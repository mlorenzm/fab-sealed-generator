import { useState } from 'react';
import './App.css';
import HNT from './HNT';
import HVY from './HVY';
import OMN from './OMN';
import IAR from './IAR';
import Select from 'react-select';

const options = [
    { value: 'HNT', label: 'The Hunted', component: <HNT /> },
    { value: 'HVY', label: 'Heavy Hitters', component: <HVY /> },
    { value: 'OMN', label: 'Omens of The Third Age', component: <OMN /> },
    { value: 'IAR', label: 'Usurp The Shadow Throne', component: <IAR /> },
];

function App() {
    const [selectedSet, setSelectedSet] = useState(options[0]);

    const handleSetChanged = value => {
        setSelectedSet(value);
    };

    return (
        <div className="App">
            <Select
                value={selectedSet}
                onChange={handleSetChanged}
                options={options}
                className="set-select-container"
            />
            <br />
            {selectedSet && selectedSet.component}
        </div>
    );
}

export default App;
