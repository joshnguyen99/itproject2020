/** @jsx jsx */
import { jsx, Container, Styled } from "theme-ui";
import React from 'react'
import PropTypes from "prop-types";


export default function SubSection({ subSection: { type, title, field_1, field_2, location, grade, isVoluntary, isOngoing, startDate, endDate, description}}) {
  const styling = {
    mt:0, 
    mb:0
  }

  const greyedOut = {
    color:"rgb(104, 104, 104)"
  }

  const IsVolunteering = () => (
    (!isVoluntary) ? "" : "Is Volunteering"
  );

  const IsOngoing = () => {
    const add = (!isOngoing) ? endDate : "Present";
    return startDate.concat(" - ", add);

  };

  const getGrade = () => {
    if (grade) {
      return "Grade: ".concat(grade);
    } else {
      return;
    }
  };

  const SubHeader = () => {
    if (type==="education") {
      return (
        <Styled.h4 sx={{...styling, fontWeight: "normal"}}>{field_1.concat(" \u00B7 ", field_2, " \u00B7 ",  getGrade())}</Styled.h4>
      );
    } else if (type==="experience") {
      return (
        <React.Fragment>
          <Styled.h4 sx={{...styling, fontWeight: "normal"}}> {field_1.concat(" \u00B7 ", field_2)} </Styled.h4>
        </React.Fragment>
      );
    }
    return;
  };

  const Out = () => {
    return (
      <Container sx={{textAlign:"left"}}>
        <Styled.h3 sx={styling} >{title}</Styled.h3>
        <SubHeader/>
        
        <Styled.p sx={{...styling, ...greyedOut, mt:"1em"}} ><IsOngoing /></Styled.p>
        <Styled.p sx={{...styling, ...greyedOut}} ><IsVolunteering /></Styled.p>
        <Styled.p sx={{...styling, ...greyedOut, mb:"1em"}} >{location}</Styled.p>
      
        <Styled.p sx={{...styling, mb:"1em"}} >{description}</Styled.p>
      </Container> 
    );
  }

  return (
    <Out />
  );
}

SubSection.propTypes = {
  subSection: PropTypes.shape({
    title: PropTypes.string,          // Job Title or School
    field_1: PropTypes.string,        // Organisation Type or Degree
    field_2: PropTypes.string,        // EmploymentType or FieldOfStudy
    location: PropTypes.string,        // Location or Location
    grade: PropTypes.string,            // For Education ONLY
    isVoluntary: PropTypes.bool,      // For Experience ONLY
    isOngoing: PropTypes.bool,        // Both Experience and Education
    startDate: PropTypes.string,      // Both Experience and Education
    endDate: PropTypes.string,        // Both Experience and Education
    description: PropTypes.string     // Both Experience and Education
  })
};