import { useState, useEffect, useRef } from 'react';
import { supabase, ExerciseLibraryItem } from '../lib/supabase';
import { Search, X, Check } from 'lucide-react';

interface ExerciseAutocompleteProps {
  value: string;
  onChange: (name: string, libraryId?: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ExerciseAutocomplete({
  value,
  onChange,
  placeholder = 'Exercise name',
  className = '',
}: ExerciseAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exercises, setExercises] = useState<ExerciseLibraryItem[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Filter exercises based on search term
    if (searchTerm.trim()) {
      const filtered = exercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(exercises);
    }
  }, [searchTerm, exercises]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
      setFilteredExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    // Allow freesolo - user can type custom exercise
    onChange(newValue);
  };

  const handleSelectExercise = (exercise: ExerciseLibraryItem) => {
    setSearchTerm(exercise.name);
    onChange(exercise.name, exercise.id);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm pr-8 focus:outline-none focus:border-blue-500 ${className}`}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-slate-400 text-sm">Loading exercises...</div>
          ) : filteredExercises.length > 0 ? (
            <>
              {/* Show custom option if user typed something not in list */}
              {searchTerm &&
                !exercises.find((ex) => ex.name.toLowerCase() === searchTerm.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(searchTerm);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-700 transition text-sm border-b border-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="text-white font-medium">"{searchTerm}"</div>
                        <div className="text-slate-400 text-xs">Add custom exercise</div>
                      </div>
                    </div>
                  </button>
                )}

              {/* Library exercises */}
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleSelectExercise(exercise)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-700 transition text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-white font-medium">{exercise.name}</div>
                      {exercise.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exercise.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {searchTerm.toLowerCase() === exercise.name.toLowerCase() && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                </button>
              ))}
            </>
          ) : searchTerm ? (
            <button
              type="button"
              onClick={() => {
                onChange(searchTerm);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-slate-700 transition text-sm"
            >
              <div className="text-white">
                Add "{searchTerm}" as custom exercise
              </div>
            </button>
          ) : (
            <div className="px-3 py-2 text-slate-400 text-sm">
              No exercises found. Start typing to add custom exercise.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

