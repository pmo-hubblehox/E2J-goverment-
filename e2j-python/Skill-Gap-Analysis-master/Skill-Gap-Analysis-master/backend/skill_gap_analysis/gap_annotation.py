
def annotate_skill_gaps(data, known_skills, skill_gaps):
    output = {skill_type: {} for skill_type in skill_gaps}
    
    for skill_type in skill_gaps:
        # Combine known and gap skills once
        relevant_skills = set(skill_gaps[skill_type]) | set(known_skills[skill_type])
        gap_skills_set = set(skill_gaps[skill_type])
        
        for category, tuples in data.items():
            # Extract skills from category
            category_skills = {item[0] for item in tuples}
            matching_skills = category_skills & relevant_skills
            
            if matching_skills:
                output[skill_type][category] = [
                    (skill, count, skill not in gap_skills_set)
                    for skill, count in tuples 
                    if skill in matching_skills
                ]
    
    return output