import {DI_GENERATOR_ENTRY_KEY, DI_GENERATOR_STATUS_SLICE_KEY} from '../constants';
import {DI_GeneratorStatusSlice} from '../data/DocumentItem';

export const defaultGeneratorStatusSlice: DI_GeneratorStatusSlice = {
    PK: {S: DI_GENERATOR_ENTRY_KEY},
    SK: {S: DI_GENERATOR_STATUS_SLICE_KEY},
    State: {S: 'idle'},
    LastRun: {N: '0'},
    LastChanged: {N: '0'},
    Error: {S: ''}
};
